"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  serverTimestamp,
  deleteDoc,
  query,
} from "firebase/firestore";

/* ================= TYPES ================= */

type Expense = {
  desc: string;
  amount: number;
  date: string;
};

type Month = {
  id?: string;
  month?: string;
  salary?: number;
  expenses?: Expense[];
};

/* ================= COMPONENT ================= */

export default function SalaryApp() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const [month, setMonth] = useState("");
  const [salary, setSalary] = useState("");

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");

  const [monthsData, setMonthsData] = useState<Month[]>([]);
  const [activeMonth, setActiveMonth] = useState<Month | null>(null);

  const [editId, setEditId] = useState<string | null>(null);

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });

    return () => unsub();
  }, [router]);

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "users", user.uid, "months"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data: Month[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Month),
        expenses: (d.data() as any).expenses ?? [],
      }));

      setMonthsData(data);

      // auto select first month if none selected
      if (!activeMonth && data.length > 0) {
        setActiveMonth(data[0]);
      }
    });

    return () => unsub();
  }, [user?.uid]);

  /* ================= SELECT MONTH ================= */

  const selectMonth = (m: Month) => {
    setActiveMonth((prev) => (prev?.id === m.id ? null : m));
  };

  /* ================= SAVE MONTH ================= */

  const saveMonth = async () => {
    if (!user?.uid) return;

    if (!month || !salary) return;

    const ref = collection(db, "users", user.uid, "months");

    if (editId) {
      await updateDoc(doc(db, "users", user.uid, "months", editId), {
        month,
        salary: Number(salary),
      });

      setEditId(null);
    } else {
      await addDoc(ref, {
        month,
        salary: Number(salary),
        expenses: [],
        createdAt: serverTimestamp(),
      });
    }

    setMonth("");
    setSalary("");
  };

  /* ================= DELETE MONTH ================= */

  const deleteMonth = async (id: string) => {
    if (!user?.uid) return;

    await deleteDoc(doc(db, "users", user.uid, "months", id));

    if (activeMonth?.id === id) {
      setActiveMonth(null);
    }
  };

  /* ================= EDIT MONTH ================= */

  const startEdit = (m: Month) => {
    setEditId(m.id || null);
    setMonth(m.month || "");
    setSalary(String(m.salary || ""));
  };

  /* ================= ADD EXPENSE (FIXED) ================= */

  const addExpense = async () => {
    if (!user?.uid || !activeMonth?.id) return;
    if (!desc || !amount) return;

    const updated: Expense[] = [
      ...(activeMonth.expenses || []),
      {
        desc,
        amount: Number(amount),
        date: new Date().toLocaleDateString(),
      },
    ];

    await updateDoc(
      doc(db, "users", user.uid, "months", activeMonth.id),
      { expenses: updated }
    );

    setDesc("");
    setAmount("");
  };

  /* ================= DELETE EXPENSE (FIXED) ================= */

  const deleteExpense = async (index: number) => {
    if (!user?.uid || !activeMonth?.id) return;

    const updated = (activeMonth.expenses || []).filter(
      (_, i) => i !== index
    );

    await updateDoc(
      doc(db, "users", user.uid, "months", activeMonth.id),
      { expenses: updated }
    );
  };

  /* ================= EDIT EXPENSE (FIXED PROPERLY) ================= */

  const editExpense = (index: number) => {
    if (!activeMonth) return;

    const item = activeMonth.expenses?.[index];
    if (!item) return;

    setDesc(item.desc);
    setAmount(String(item.amount));

    // DO NOT DELETE HERE (this was your bug)
  };

  /* ================= CALC ================= */

  const totalExpenses =
    activeMonth?.expenses?.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    ) || 0;

  const balance = Number(activeMonth?.salary || 0) - totalExpenses;

  if (!user) return null;

  /* ================= UI ================= */

  return (
    <div className="relative min-h-screen">

      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/money-bg.jpg')" }}
      />

      <div className="fixed inset-0 bg-black/60" />

      <div className="relative z-10 p-4 max-w-md mx-auto grid gap-4 pb-40 text-black">

        {/* MONTH FORM */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-bold">Month</h2>

            <Input
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="Month"
            />

            <Input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="Salary"
            />

            <Button onClick={saveMonth} className="w-full mt-2">
              {editId ? "Update" : "Save"}
            </Button>
          </CardContent>
        </Card>

        {/* MONTH LIST */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-bold">Months</h2>

            {monthsData.map((m) => (
              <div key={m.id} className="flex justify-between border-b py-2">

                <div
                  onClick={() => selectMonth(m)}
                  className="cursor-pointer"
                >
                  {m.month} - {m.salary}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => startEdit(m)}>Edit</button>
                  <button onClick={() => deleteMonth(m.id!)}>Del</button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ACTIVE MONTH */}
        {activeMonth && (
          <>
            <Card>
              <CardContent className="p-4">
                <h2 className="font-bold">{activeMonth.month}</h2>
                <p>Salary: {activeMonth.salary}</p>
                <p>Expenses: {totalExpenses}</p>
                <p className="font-bold">Balance: {balance}</p>
              </CardContent>
            </Card>

            {/* EXPENSE FORM */}
            <Card>
              <CardContent className="p-4">
                <Input
                  placeholder="Desc"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />

                <Input
                  placeholder="Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />

                <Button onClick={addExpense} className="w-full mt-2">
                  Add Expense
                </Button>
              </CardContent>
            </Card>

            {/* HISTORY (NOW FIXED) */}
            <Card>
              <CardContent className="p-4">
                <h2 className="font-bold">History</h2>

                {(activeMonth.expenses || []).length === 0 ? (
                  <p>No expenses yet</p>
                ) : (
                  activeMonth.expenses!.map((e, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-3 border-b py-1"
                    >
                      <div>{e.desc}</div>
                      <div className="text-center">{e.amount}</div>

                      <div className="flex justify-end gap-2">
                        <button onClick={() => editExpense(i)}>Edit</button>
                        <button onClick={() => deleteExpense(i)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}