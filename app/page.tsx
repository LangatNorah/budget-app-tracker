"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { onSnapshot, collection } from "firebase/firestore";
import Link from "next/link";

/* ================= TYPES ================= */

type Expense = {
  amount?: number | string;
};

type Month = {
  salary?: number | string;
  expenses?: Expense[];
};

type Hustle = {
  capital?: number | string;
  sales?: Expense[];
  expenses?: Expense[];
};

/* ================= COMPONENT ================= */

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [months, setMonths] = useState<Month[]>([]);
  const [hustles, setHustles] = useState<Hustle[]>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
    });

    const unsubMonths = onSnapshot(collection(db, "months"), (snap) => {
      setMonths(
        snap.docs.map((d) => ({
          ...(d.data() as Month),
          expenses: (d.data() as Month).expenses || [],
        }))
      );
    });

    const unsubHustles = onSnapshot(collection(db, "hustleCapitals"), (snap) => {
      const data: Hustle[] = snap.docs.map((doc) => {
        const d = doc.data();

        return {
          capital: d.capital || 0,
          sales: Array.isArray(d.sales) ? d.sales : [],
          expenses: Array.isArray(d.expenses) ? d.expenses : [],
        };
      });

      setHustles(data);
    });

    return () => {
      unsubAuth();
      unsubMonths();
      unsubHustles();
    };
  }, [router]);

  /* ================= CALCULATIONS ================= */

  const salary = months.reduce(
    (sum, m) => sum + Number(m.salary || 0),
    0
  );

  const expenses = months.reduce((sum, m) => {
    return (
      sum +
      (m.expenses || []).reduce(
        (s, e) => s + Number(e.amount || 0),
        0
      )
    );
  }, 0);

  const hustle = hustles.reduce(
    (sum, h) => sum + Number(h.capital || 0),
    0
  );

  const balance = salary + hustle - expenses;

  /* ================= UI ================= */

  if (!user) return null;

  return (
    <div className="relative min-h-screen text-black">

      {/* BACKGROUND IMAGE */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/money-bg.jpg')" }}
      />

      {/* OVERLAY */}
      <div className="fixed inset-0 bg-black/60" />

      {/* CONTENT */}
      <div className="relative z-10 p-4 max-w-md mx-auto pb-24">
        <h1 className="text-xl font-bold mb-4">📊 Dashboard</h1>

        <div className="grid gap-3">
          <div className="bg-white backdrop-blur-md p-4 rounded-xl shadow">
            💰 Salary
            <h2 className="font-bold text-xl">{salary}</h2>
          </div>

          <div className="bg-white backdrop-blur-md p-4 rounded-xl shadow">
            💼 Hustle
            <h2 className="font-bold text-xl">{hustle}</h2>
          </div>

          <div className="bg-white backdrop-blur-md p-4 rounded-xl shadow">
            💸 Expenses
            <h2 className="font-bold text-xl">{expenses}</h2>
          </div>

          <div className="bg-white backdrop-blur-md p-4 rounded-xl shadow">
            💵 Balance
            <h2 className="font-bold text-xl">{balance}</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <Link href="/salary">
            <div className="bg-green-500/20 backdrop-blur-md p-4 rounded-xl shadow">
              💰 Go to Salary Tracker
            </div>
          </Link>

          <Link href="/hustle">
            <div className="bg-green-500/20 backdrop-blur-md p-4 rounded-xl shadow">
              💼 Go to Hustle Tracker
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}