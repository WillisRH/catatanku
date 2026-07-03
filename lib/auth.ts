import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await (prisma.user.findUnique as any)({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        // Layer 1: block suspended users at credentials login
        if (user.isSuspended) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        const existing = await (prisma.user.findUnique as any)({ where: { email: user.email } });
        if (existing) {
          // Layer 2a: block suspended users at Google OAuth login
          if (existing.isSuspended) return false;
          user.id = existing.id;
          // If they previously used email/password, stamp emailVerified now
          if (!existing.emailVerified) {
            await prisma.user.update({
              where: { id: existing.id },
              data: { emailVerified: new Date() },
            });
          }
        }
        return true;
      }

      // Layer 2b: block suspended users at credentials login (double-check after authorize)
      if (account?.provider === "credentials" && user?.id) {
        const dbUser = await (prisma.user.findUnique as any)({
          where: { id: user.id },
          select: { isSuspended: true },
        });
        if (dbUser?.isSuspended) return false;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) token.sub = user.id;
      if (user?.image !== undefined) token.picture = user.image;
      if (account?.provider === "google" && user?.image) {
        token.picture = user.image;
      }

      // Layer 3: on every token read (not sign-in), re-check suspension from DB.
      // This invalidates active sessions the moment a user is suspended.
      if (token.sub && !account) {
        const dbUser = await (prisma.user.findUnique as any)({
          where: { id: token.sub },
          select: { isSuspended: true, suspendReason: true },
        });
        (token as any).suspended = !!dbUser?.isSuspended;
        (token as any).suspendReason = dbUser?.isSuspended ? (dbUser.suspendReason ?? null) : null;
      }

      return token;
    },
    async session({ session, token }) {
      // If suspended: expose the flag to the client but strip user.id
      // so all API route auth checks fail (they all check session.user.id)
      if ((token as any).suspended) {
        if (session.user) {
          (session.user as any).suspended = true;
          (session.user as any).suspendReason = (token as any).suspendReason ?? null;
        }
        return session;
      }

      if (token.sub && session.user) {
        // @ts-ignore
        session.user.id = token.sub;
      }
      if (token.picture !== undefined && session.user) {
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  trustHost: true,
});
