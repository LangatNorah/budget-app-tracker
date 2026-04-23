"use client";

import { useEffect, useState } from "react";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const [months, setMonths] = useState([]);
  const [hustles, setHustles] = useState([]);

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "months"), (snap) => {
      setMonths(snap.docs.map((d) => d.data()));
    });

    const unsub2 = onSnapshot(collection(db, "hustles"), (snap) => {
      setHustles(snap.docs.map((d) => d.data()));
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const salary = months.reduce(
    (s, m) => s + (Number(m.salary) || 0),
    0
  );

  const expenses = months.reduce(
    (s, m) =>
      s +
      (m.expenses || []).reduce(
        (a, e) => a + (Number(e.amount) || 0),
        0
      ),
    0
  );

  const hustle = hustles.reduce(
    (s, h) => s + (Number(h.amount) || 0),
    0
  );

  const balance = salary + hustle - expenses;

  return (
    <div className="p-4 max-w-md mx-auto">

      <h1 className="text-xl font-bold mb-4">
        📊 Dashboard
      </h1>

      <div className="grid gap-3">

        <div className="bg-white p-4 rounded-xl shadow">
          💰 Salary: {salary}
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          💼 Hustle: {hustle}
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          💸 Expenses: {expenses}
        </div>

        <div className="bg-green-100 p-4 rounded-xl shadow">
          💵 Balance: {balance}
        </div>

      </div>
    </div>
  );
}