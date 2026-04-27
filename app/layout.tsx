"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  const path = usePathname();

  const hideNav = path === "/login";

  const tabStyle = (route: string) =>
    `flex flex-col items-center text-xs ${
      path === route ? "text-blue-600 font-semibold" : "text-gray-400"
    }`;

  return (
    <html lang="en">
      <body className="relative min-h-screen overflow-x-hidden">

        {/* ✅ BACKGROUND IMAGE */}
        <div
          className="fixed inset-0 bg-cover bg-center -z-20"
          style={{ backgroundImage: "url('/money-bg.jpg')" }}
        />

        {/* ✅ SOFTER OVERLAY (better with glass UI) */}
        <div className="fixed inset-0 bg-black/50 -z-10" />

        {/* ✅ CONTENT WRAPPER */}
        <div className="relative z-10 min-h-screen pb-24">
          {children}
        </div>

        {/* ✅ BOTTOM NAV */}
        {!hideNav && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t flex justify-around py-3 shadow-md z-20">

            <Link href="/" className={tabStyle("/")}>
              <span>🏠</span>
              <span>Home</span>
            </Link>

            <Link href="/salary" className={tabStyle("/salary")}>
              <span>💰</span>
              <span>Salary</span>
            </Link>

            <Link href="/hustle" className={tabStyle("/hustle")}>
              <span>💼</span>
              <span>Hustle</span>
            </Link>

          </div>
        )}
      </body>
    </html>
  );
}