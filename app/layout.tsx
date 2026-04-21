import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Catatanku - Diary Digital",
  description: "Simpan ceritamu dengan aman dan terenkripsi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Apply saved app theme before paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('catatanku_app_theme')||'default';var T={'sage':{'--bg':'#F2F7F4','--surface':'#FFFFFF','--header-bg':'rgba(242,247,244,0.93)','--ink':'#1E2E24','--ink2':'#5A7A64','--ink3':'#94B49A','--accent':'#4A8A64','--accent-soft':'#C4DED0','--line':'#D0E4D8','--shadow':'0 2px 20px rgba(30,46,36,0.06)','--scroll-thumb':'#4A8A64','--scroll-track':'#C4DED0','--scroll-thumb-hover':'#37694d','--surface2':'rgba(0,0,0,0.07)'},'dark':{'--bg':'#282C34','--surface':'#21252B','--header-bg':'rgba(33,37,43,0.96)','--ink':'#ABB2BF','--ink2':'#828997','--ink3':'#4B5263','--accent':'#61AFEF','--accent-soft':'rgba(97,175,239,0.15)','--line':'#3E4451','--shadow':'0 2px 20px rgba(0,0,0,0.3)','--scroll-thumb':'#61AFEF','--scroll-track':'#3E4451','--scroll-thumb-hover':'#4d99d9','--surface2':'rgba(255,255,255,0.08)'},'ocean':{'--bg':'#EDF6FF','--surface':'#FFFFFF','--header-bg':'rgba(237,246,255,0.93)','--ink':'#1A2E42','--ink2':'#4A6A8A','--ink3':'#7A9AB8','--accent':'#3D7FBF','--accent-soft':'#C4DCF0','--line':'#B4CCE8','--shadow':'0 2px 20px rgba(26,46,66,0.06)','--scroll-thumb':'#3D7FBF','--scroll-track':'#C4DCF0','--scroll-thumb-hover':'#2e6498','--surface2':'rgba(0,0,0,0.07)'},'violet':{'--bg':'#1A1525','--surface':'#221D30','--header-bg':'rgba(26,21,37,0.96)','--ink':'#E5E0F8','--ink2':'#A090C8','--ink3':'#6B5A90','--accent':'#A78BFA','--accent-soft':'rgba(167,139,250,0.15)','--line':'#362D4A','--shadow':'0 2px 20px rgba(0,0,0,0.35)','--scroll-thumb':'#A78BFA','--scroll-track':'#362D4A','--scroll-thumb-hover':'#8B6FE8','--surface2':'rgba(255,255,255,0.08)'}};var el=document.documentElement;if(T[t]){Object.entries(T[t]).forEach(function(e){el.style.setProperty(e[0],e[1]);});el.setAttribute('data-app-theme',t);};}catch(e){}})();` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
