"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function SalaryApp() {
  const [month, setMonth] = useState("");
  const [salary, setSalary] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");

  const [monthsData, setMonthsData] = useState<any[]>([]);
  const [activeMonth, setActiveMonth] = useState<any | null>(null);

  const [editId, setEditId] = useState<string | null>(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    const q = query(collection(db, "months"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        expenses: (d.data() as any).expenses || [],
      }));

      setMonthsData(data);
    });

    return () => unsub();
  }, []);

  /* ================= SYNC ================= */
  useEffect(() => {
    if (!activeMonth) return;

    const updated = monthsData.find((m) => m.id === activeMonth.id);

    if (updated) {
      setActiveMonth({
        ...updated,
        expenses: updated.expenses || [],
      });
    }
  }, [monthsData]);

  /* ================= FIXED TOGGLE ================= */
  const selectMonth = (m: any) => {
    if (activeMonth?.id === m.id) {
      setActiveMonth(null); // close when clicked again
    } else {
      setActiveMonth({ ...m, expenses: m.expenses || [] });
    }
  };

  /* ================= SAVE ================= */
  const saveMonth = async () => {
    if (!month || !salary) return alert("Fill all fields");

    if (editId) {
      await updateDoc(doc(db, "months", editId), {
        month,
        salary: Number(salary),
      });
      setEditId(null);
    } else {
      await addDoc(collection(db, "months"), {
        month,
        salary: Number(salary),
        expenses: [],
        createdAt: serverTimestamp(),
      });
    }

    setMonth("");
    setSalary("");
  };

  const deleteMonth = async (id: string) => {
    await deleteDoc(doc(db, "months", id));
    if (activeMonth?.id === id) setActiveMonth(null);
  };

  const startEditMonth = (m: any) => {
    setEditId(m.id);
    setMonth(m.month);
    setSalary(String(m.salary));
  };

  /* ================= EXPENSE ================= */
  const addExpense = async () => {
    if (!desc || !amount || !activeMonth?.id) return;

    const updated = [
      ...(activeMonth.expenses || []),
      {
        desc,
        amount: Number(amount),
        date: new Date().toLocaleDateString(),
      },
    ];

    await updateDoc(doc(db, "months", activeMonth.id), {
      expenses: updated,
    });

    setDesc("");
    setAmount("");
  };

  const deleteExpense = async (index: number) => {
    if (!activeMonth) return;

    const updated = activeMonth.expenses.filter(
      (_: any, i: number) => i !== index
    );

    await updateDoc(doc(db, "months", activeMonth.id), {
      expenses: updated,
    });
  };

  const editExpense = async (index: number) => {
    if (!activeMonth) return;

    const item = activeMonth.expenses[index];
    setDesc(item.desc);
    setAmount(String(item.amount));

    await deleteExpense(index);
  };

  /* ================= CALC ================= */
  const totalExpenses =
    activeMonth?.expenses?.reduce(
      (sum: number, e: any) => sum + Number(e.amount || 0),
      0
    ) || 0;

  const balance = (activeMonth?.salary || 0) - totalExpenses;

  /* ================= UI ================= */
  return (
    <div className="relative min-h-screen">

      {/* BACKGROUND */}
      <div
        className="fixed inset-0 bg-cover bg-center -z-20"
        style={{ backgroundImage: "url('/money-bg.jpg')" }}
      />

      {/* OVERLAY */}
      <div className="fixed inset-0 bg-black/60 -z-10" />

      {/* CONTENT */}
      <div className="relative z-10 p-4 max-w-md mx-auto grid gap-4 pb-40 text-black">

        {/* FORM */}
        <Card className="bg-white shadow">
          <CardContent className="p-4">
            <h2 className="font-bold">
              {editId ? "Edit Month" : "Create Month"}
            </h2>

            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-black bg-white"
            />

            <Input
              type="number"
              placeholder="Salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="text-black"
            />

            <Button onClick={saveMonth} className="mt-2 w-full">
              {editId ? "Update Month" : "Save Month"}
            </Button>
          </CardContent>
        </Card>

        {/* MONTH LIST */}
        <Card className="bg-white shadow">
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
                  <button onClick={() => startEditMonth(m)} className="text-blue-600 text-sm">
                    Edit
                  </button>
                  <button onClick={() => deleteMonth(m.id)} className="text-red-600 text-sm">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ACTIVE */}
        {activeMonth && (
          <>
            <Card className="bg-white shadow">
              <CardContent className="p-4">
                <h2 className="font-bold">{activeMonth.month}</h2>

                <p>Salary: {activeMonth.salary}</p>
                <p>Total Expenses: {totalExpenses}</p>
                <p className="font-bold">Balance: {balance}</p>
              </CardContent>
            </Card>

            {/* EXPENSE FORM */}
            <Card className="bg-white shadow">
              <CardContent className="p-4">
                <h2 className="font-bold">Add Expense</h2>

                <Input
                  placeholder="Description"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="text-black"
                />

                <Input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-black"
                />

                <Button onClick={addExpense} className="mt-2 w-full">
                  Add Expense
                </Button>
              </CardContent>
            </Card>

            {/* HISTORY */}
   {/* EXPENSE HISTORY */}
<Card className="bg-white border">
  <CardContent className="p-4">
    <h2 className="font-bold">Expense History</h2>

    {(activeMonth.expenses || []).length === 0 ? (
      <p>No expenses yet</p>
    ) : (
      activeMonth.expenses.map((e: any, i: number) => (
        <div
          key={i}
          className="grid grid-cols-3 items-center border-b py-1"
        >
          {/* LEFT */}
          <div className="text-left">
            <p className="text-sm">
              {e.desc} ({e.date})
            </p>
          </div>

          {/* MIDDLE (AMOUNT) */}
          <div className="text-center font-semibold">
            {e.amount}
          </div>

          {/* RIGHT */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => editExpense(i)}
              className="text-blue-600 text-sm"
            >
              Edit
            </button>

            <button
              onClick={() => deleteExpense(i)}
              className="text-red-600 text-sm"
            >
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