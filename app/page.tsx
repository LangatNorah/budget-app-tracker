"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { onSnapshot, collection } from "firebase/firestore";

/* ================= TYPES ================= */

type Expense = { amount?: number | string };

type Month = {
  salary?: number | string;
  expenses?: Expense[];
};

type Hustle = {
  capital?: number | string;
  sales?: { amount?: number | string }[];
  expenses?: Expense[];
  userId?: string;
};

/* ================= COMPONENT ================= */

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [months, setMonths] = useState<Month[]>([]);
  const [hustles, setHustles] = useState<Hustle[]>([]);

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });

    return () => unsub();
  }, [router]);

  /* ================= DATA ================= */

  useEffect(() => {
    if (!user?.uid) return;

    const monthsRef = collection(db, "users", user.uid, "months");
    const hustleRef = collection(db, "hustleCapitals");

    const unsubMonths = onSnapshot(monthsRef, (snap) => {
      setMonths(
        snap.docs.map((d) => ({
          ...(d.data() as Month),
          expenses: (d.data() as any).expenses || [],
        }))
      );
    });

    const unsubHustles = onSnapshot(hustleRef, (snap) => {
      setHustles(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Hustle) }))
          .filter((h) => h.userId === user.uid)
      );
    });

    return () => {
      unsubMonths();
      unsubHustles();
    };
  }, [user?.uid]);

  /* ================= CALCULATIONS ================= */

  const salary = months.reduce((s, m) => s + Number(m.salary || 0), 0);

  const salaryExpenses = months.reduce(
    (s, m) =>
      s +
      (m.expenses || []).reduce(
        (a, e) => a + Number(e.amount || 0),
        0
      ),
    0
  );

  const hustleSales = hustles.reduce(
    (s, h) =>
      s +
      (h.sales || []).reduce(
        (a, x) => a + Number(x.amount || 0),
        0
      ),
    0
  );

  const hustleCapital = hustles.reduce(
    (s, h) => s + Number(h.capital || 0),
    0
  );

  const hustleExpenses = hustles.reduce(
    (s, h) =>
      s +
      (h.expenses || []).reduce(
        (a, e) => a + Number(e.amount || 0),
        0
      ),
    0
  );

  /* ================= FORMULA ================= */

  const hustleProfit = hustleSales - hustleCapital;
  const totalExpenses = salaryExpenses + hustleExpenses;
  const balance = salary + hustleProfit - totalExpenses;

  if (!user) return null;

  return (
    <div className="relative min-h-screen">

      {/* BACKGROUND */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/money-bg.jpg')" }}
      />

      {/* OVERLAY */}
      <div className="fixed inset-0 bg-black/60" />

      {/* ✅ TOP LAYOUT (RESTORED) */}
      <div className="relative z-10 p-4 max-w-md mx-auto">

        <h1 className="text-xl font-bold mb-4 text-white">
          📊 Dashboard
        </h1>

        <div className="grid gap-3">

          <div className="bg-white p-4 rounded-xl shadow">
            💰 Salary
            <h2 className="font-bold">{salary}</h2>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            💼 Hustle Profit
            <h2 className="font-bold">{hustleProfit}</h2>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            💸 Expenses
            <h2 className="font-bold">{totalExpenses}</h2>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            💵 Balance
            <h2 className="font-bold">{balance}</h2>
          </div>

        </div>

      </div>
    </div>
  );
}