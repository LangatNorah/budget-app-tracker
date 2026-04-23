"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";


export default function RootLayout({ children }) {
  const path = usePathname();

  const hideNav = path === "/login";

  const tabStyle = (route) =>
    `text-center text-sm ${
      path === route ? "text-blue-600 font-bold" : "text-gray-500"
    }`;

  return (
    <html lang="en">

   

      <body className="bg-gray-100">

        <div className="pb-24">{children}</div>

        {/* 🚫 HIDE NAV ON LOGIN PAGE */}
        {!hideNav && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 shadow-md">

            <Link href="/" className={tabStyle("/")}>
              🏠
              <div>Home</div>
            </Link>

            <Link href="/salary" className={tabStyle("/salary")}>
              💰
              <div>Salary</div>
            </Link>

            <Link href="/hustle" className={tabStyle("/hustle")}>
              💼
              <div>Hustle</div>
            </Link>

          </div>
        )}

      </body>
    </html>
  );
}