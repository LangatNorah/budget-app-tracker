"use client";

import Link from "next/link";

export default function Nav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-around bg-white border p-3">
      <Link href="/salary">Salary</Link>
      <Link href="/hustle">Hustle</Link>
    </div>
  );
}