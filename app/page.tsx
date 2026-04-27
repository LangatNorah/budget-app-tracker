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

/* ================= ANIMATION HOOK ================= */

function useCount(value: number, duration = 600) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.floor(value / (duration / 16)));

    const interval = setInterval(() => {
      start += step;

      if (start >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(start);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [value]);

  return display;
}

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [months, setMonths] = useState<Month[]>([]);
  const [hustles, setHustles] = useState<Hustle[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

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

  const salaryRaw = months.reduce((s, m) => s + Number(m.salary || 0), 0);

  const salaryExpensesRaw = months.reduce(
    (s, m) =>
      s +
      (m.expenses || []).reduce(
        (a, e) => a + Number(e.amount || 0),
        0
      ),
    0
  );

  const hustleSalesRaw = hustles.reduce(
    (s, h) =>
      s +
      (h.sales || []).reduce(
        (a, x) => a + Number(x.amount || 0),
        0
      ),
    0
  );

  const hustleCapitalRaw = hustles.reduce(
    (s, h) => s + Number(h.capital || 0),
    0
  );

  const hustleExpensesRaw = hustles.reduce(
    (s, h) =>
      s +
      (h.expenses || []).reduce(
        (a, e) => a + Number(e.amount || 0),
        0
      ),
    0
  );

  const hustleProfitRaw = hustleSalesRaw - hustleCapitalRaw;
  const totalExpensesRaw = salaryExpensesRaw + hustleExpensesRaw;
  const balanceRaw = salaryRaw + hustleProfitRaw - totalExpensesRaw;

  /* ================= ANIMATED VALUES ================= */

  const salary = useCount(salaryRaw);
  const hustleProfit = useCount(hustleProfitRaw);
  const totalExpenses = useCount(totalExpensesRaw);
  const balance = useCount(balanceRaw);

  if (!user) return null;

  const cards = [
    { label: "💰 Salary", value: salary },
    { label: "💼 Hustle Profit", value: hustleProfit },
    { label: "💸 Expenses", value: totalExpenses },
    { label: "💵 Balance", value: balance },
  ];

  return (
    <div className="relative min-h-screen text-black">

      {/* BACKGROUND */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/money-bg.jpg')" }}
      />

      {/* OVERLAY */}
      <div className="fixed inset-0 bg-black/60" />

      {/* CENTER */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">

        <div className="w-full max-w-md">

          <h1 className="text-xl font-bold mb-4 text-white text-center">
            📊 Dashboard
          </h1>

          {/* SWIPE CARDS */}
          <div
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            onScroll={(e) => {
              const index = Math.round(
                e.currentTarget.scrollLeft /
                  e.currentTarget.clientWidth
              );
              setActiveIndex(index);
            }}
          >
            {cards.map((c, i) => (
              <div
                key={i}
                className="min-w-full snap-center bg-white p-6 rounded-2xl shadow-lg transition"
              >
                <p className="text-gray-500">{c.label}</p>

                <h2
                  className={`text-3xl font-bold mt-2 ${
                    c.label.includes("Profit")
                      ? c.value >= 0
                        ? "text-green-600"
                        : "text-red-600"
                      : ""
                  }`}
                >
                  {c.value}
                </h2>
              </div>
            ))}
          </div>

          {/* DOTS INDICATOR */}
          <div className="flex justify-center gap-2 mt-4">
            {cards.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition ${
                  i === activeIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>

        </div>
      </div>

      {/* HIDE SCROLLBAR */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}