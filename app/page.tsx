"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { onSnapshot, collection } from "firebase/firestore";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

/* ================= COMPONENT ================= */

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [months, setMonths] = useState<any[]>([]);
  const [hustles, setHustles] = useState<any[]>([]);

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });

    return () => unsub();
  }, [router]);

  /* ================= LOGOUT ================= */

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  /* ================= DATA ================= */

  useEffect(() => {
    if (!user?.uid) return;

    const monthsRef = collection(db, "users", user.uid, "months");
    const hustleRef = collection(db, "hustleCapitals");

    const unsubMonths = onSnapshot(monthsRef, (snap) => {
      setMonths(
        snap.docs.map((d) => ({
          ...(d.data() as any),
          expenses: (d.data() as any).expenses || [],
        }))
      );
    });

    const unsubHustles = onSnapshot(hustleRef, (snap) => {
      setHustles(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
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

  const expenses = months.reduce(
    (s, m) =>
      s +
      (m.expenses || []).reduce(
        (a: number, e: any) => a + Number(e.amount || 0),
        0
      ),
    0
  );

  const hustleSales = hustles.reduce(
    (s, h) =>
      s +
      (h.sales || []).reduce(
        (a: number, x: any) => a + Number(x.amount || 0),
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
        (a: number, e: any) => a + Number(e.amount || 0),
        0
      ),
    0
  );

  const hustleProfit = hustleSales - hustleCapital - hustleExpenses;

  /* ================= SALARY BUDGET ================= */

  const needs = salary * 0.5;
  const wants = salary * 0.3;
  const savings = salary * 0.2;

  const budgetData = [
    { name: "Needs", value: needs },
    { name: "Wants", value: wants },
    { name: "Savings", value: savings },
  ];

  const isLow = expenses > salary * 0.8;

  if (!user) return null;

  return (
    <div className="relative min-h-screen">

      {/* BACKGROUND */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/money-bg.jpg')" }}
      />
      <div className="fixed inset-0 bg-black/60" />

      <div className="relative z-10 max-w-6xl mx-auto p-4">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-white text-lg font-semibold">
            Budget Dashboard
          </h1>

          <button
            onClick={handleLogout}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm"
          >
            Logout
          </button>
        </div>

        {/* ================= 2 COLUMN LAYOUT ================= */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* ================= SALARY ================= */}
          <div className="bg-white/90 p-5 rounded-2xl">

            <h2 className="text-sm font-semibold text-gray-600 mb-3">
              💰 Salary Budget Plan
            </h2>

            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={budgetData}
                  dataKey="value"
                  outerRadius={80}
                  innerRadius={50}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#22c55e" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* ✅ FIXED SALARY LEGEND BOXES (YOUR STYLE) */}
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">

              <div className="border-l-4 border-blue-500 bg-blue-50 p-2 rounded-lg">
                <p className="text-gray-600 font-medium">Needs</p>
                <p className="text-xs text-gray-500">
                  {needs.toFixed(0)} (50%)
                </p>
              </div>

              <div className="border-l-4 border-yellow-500 bg-yellow-50 p-2 rounded-lg">
                <p className="text-gray-600 font-medium">Wants</p>
                <p className="text-xs text-gray-500">
                  {wants.toFixed(0)} (30%)
                </p>
              </div>

              <div className="border-l-4 border-green-500 bg-green-50 p-2 rounded-lg">
                <p className="text-gray-600 font-medium">Savings</p>
                <p className="text-xs text-gray-500">
                  {savings.toFixed(0)} (20%)
                </p>
              </div>

            </div>
          </div>

          {/* ================= HUSTLE ================= */}
          <div className="bg-white/90 p-5 rounded-2xl">

            <h2 className="text-sm font-semibold text-gray-600 mb-3">
              💼 Hustle Performance
            </h2>

            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Capital", value: hustleCapital },
                    { name: "Sales", value: hustleSales },
                    { name: "Expenses", value: hustleExpenses },
                    { name: "Profit", value: hustleProfit > 0 ? hustleProfit : 0 },
                  ]}
                  dataKey="value"
                  outerRadius={80}
                  innerRadius={50}
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#22c55e" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* HUSTLE BOXES */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">

              <div className="border-l-4 border-indigo-500 bg-indigo-50 p-2 rounded-lg">
                <p>Capital</p>
                <p>{hustleCapital}</p>
              </div>

              <div className="border-l-4 border-green-500 bg-green-50 p-2 rounded-lg">
                <p>Sales</p>
                <p>{hustleSales}</p>
              </div>

              <div className="border-l-4 border-red-500 bg-red-50 p-2 rounded-lg">
                <p>Expenses</p>
                <p>{hustleExpenses}</p>
              </div>

              <div className="border-l-4 border-emerald-500 bg-emerald-50 p-2 rounded-lg">
                <p>Profit</p>
                <p>{hustleProfit}</p>
              </div>

            </div>
          </div>
        </div>

        {/* ALERT */}
        {isLow && (
          <div className="bg-red-500 text-white p-3 rounded-xl text-sm mt-4">
            ⚠️ Warning: You are close to exceeding your salary budget.
          </div>
        )}

      </div>
    </div>
  );
}