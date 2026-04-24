"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  const path = usePathname();

  const hideNav = path === "/login";

  const tabStyle = (route: string) =>
    `text-center text-sm ${
      path === route ? "text-blue-600 font-bold" : "text-gray-500"
    }`;

  return (
    
    <html lang="en">
      <body className="bg-green-900">
        <div className="pb-24">{children}</div>

        {!hideNav && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 shadow-md">
            <Link href="/" className={tabStyle("/")}>
              🏠<div>Home</div>
            </Link>

            <Link href="/salary" className={tabStyle("/salary")}>
              💰<div>Salary</div>
            </Link>

            <Link href="/hustle" className={tabStyle("/hustle")}>
              💼<div>Hustle</div>
            </Link>
          </div>
        )}
      </body>
    </html>
  );
}