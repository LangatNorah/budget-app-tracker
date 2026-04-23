"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { onSnapshot, collection } from "firebase/firestore";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  // ✅ FIX: proper typing
  const [user, setUser] = useState<User | null>(null);

  // ✅ FIX: avoid "never[]" error
  const [months, setMonths] = useState<any[]>([]);
  const [hustles, setHustles] = useState<any[]>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      setUser(u);
    });

    const unsub1 = onSnapshot(collection(db, "months"), (snap) => {
      setMonths(
        snap.docs.map((d) => ({
          ...d.data(),
          expenses: d.data()?.expenses || [],
        }))
      );
    });

    const unsub2 = onSnapshot(collection(db, "hustles"), (snap) => {
      setHustles(snap.docs.map((d) => d.data()));
    });

    return () => {
      unsubAuth();
      unsub1();
      unsub2();
    };
  }, []);

  // CALCULATIONS
  const salary = months.reduce(
    (sum, m) => sum + (Number(m.salary) || 0),
    0
  );

  const expenses = months.reduce(
    (sum, m) =>
      sum +
      (m.expenses || []).reduce(
        (s: number, e: any) => s + (Number(e.amount) || 0),
        0
      ),
    0
  );

  const hustle = hustles.reduce(
    (sum, h) => sum + (Number(h.amount) || 0),
    0
  );

  const balance = salary + hustle - expenses;

  if (!user) return null;

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">📊 Dashboard</h1>
      </div>

      {/* CARDS */}
      <div className="grid gap-3">
        <div className="bg-white p-4 rounded-xl shadow">
          💰 Salary
          <h2 className="font-bold text-xl">{salary}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          💼 Hustle
          <h2 className="font-bold text-xl">{hustle}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          💸 Expenses
          <h2 className="font-bold text-xl">{expenses}</h2>
        </div>

        <div className="bg-green-100 p-4 rounded-xl shadow">
          💵 Balance
          <h2 className="font-bold text-xl">{balance}</h2>
        </div>
      </div>

      {/* NAV */}
      <div className="mt-6 grid gap-3">
        <Link href="/salary">
          <div className="bg-white p-4 rounded-xl shadow cursor-pointer">
            💰 Go to Salary Tracker
          </div>
        </Link>

        <Link href="/hustle">
          <div className="bg-white p-4 rounded-xl shadow cursor-pointer">
            💼 Go to Hustle Tracker
          </div>
        </Link>
      </div>
    </div>
  );
}