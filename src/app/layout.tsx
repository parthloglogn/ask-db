
"use client";

import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "../styles/index.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body className={`bg-[#FCFCFC] dark:bg-black ${inter.className}`}>
        <SessionProvider>{children} </SessionProvider>
      </body>
    </html>
  );
}

