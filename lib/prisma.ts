import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function makePrisma() {
  const base = process.env.DATABASE_URL ?? "";
  // Cap connections per process so HMR restarts don't exhaust the pool
  const url = base.includes("connection_limit")
    ? base
    : base + (base.includes("?") ? "&" : "?") + "connection_limit=3&pool_timeout=20";

  return new PrismaClient({ datasources: { db: { url } } });
}

export const prisma = global.prismaGlobal ?? makePrisma();

// Always persist — the old code skipped this in production,
// which let Turbopack's prod-mode runtime create a new client per request.
global.prismaGlobal = prisma;
