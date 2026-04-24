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

  // LOAD MONTHS
  useEffect(() => {
    const q = query(
      collection(db, "months"),
      orderBy("createdAt", "desc")
    );

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

  // SYNC ACTIVE MONTH
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

  // SAVE OR UPDATE MONTH
  const saveMonth = async () => {
    try {
      if (!month || !salary) {
        alert("Fill all fields");
        return;
      }

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
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE MONTH
  const deleteMonth = async (id: string) => {
    try {
      await deleteDoc(doc(db, "months", id));

      if (activeMonth?.id === id) {
        setActiveMonth(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // SELECT MONTH
  const selectMonth = (m: any) => {
    setActiveMonth({
      ...m,
      expenses: m.expenses || [],
    });
  };

  // START EDIT MONTH
  const startEditMonth = (m: any) => {
    setEditId(m.id);
    setMonth(m.month);
    setSalary(m.salary);
  };

  // ADD EXPENSE
  const addExpense = async () => {
    try {
      if (!desc || !amount) {
        alert("Fill expense fields");
        return;
      }

      if (!activeMonth?.id) {
        alert("Select month first");
        return;
      }

      const ref = doc(db, "months", activeMonth.id);

      const updated = [
        ...(activeMonth.expenses || []),
        {
          desc,
          amount: Number(amount),
          date: new Date().toLocaleDateString(),
        },
      ];

      await updateDoc(ref, {
        expenses: updated,
      });

      setDesc("");
      setAmount("");
    } catch (err) {
      console.error(err);
    }
  };

  const editExpense = async (index: number) => {
    if (!activeMonth) return;

    const item = activeMonth.expenses?.[index];
    if (!item) return;

    setDesc(item.desc);
    setAmount(item.amount);

    const updated = activeMonth.expenses.filter(
      (_: any, i: number) => i !== index
    );

    await updateDoc(doc(db, "months", activeMonth.id), {
      expenses: updated,
    });
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

  const totalExpenses =
    activeMonth?.expenses?.reduce(
      (sum: number, e: any) => sum + Number(e.amount || 0),
      0
    ) || 0;

  const balance = (activeMonth?.salary || 0) - totalExpenses;

  return (
     <div className="relative min-h-screen text-white overflow-x-hidden">

    {/* BACKGROUND */}
    <div
      className="fixed inset-0 bg-cover bg-center -z-20"
      style={{ backgroundImage: "url('/money-bg.jpg')" }}
    />

    {/* OVERLAY */}
    <div className="fixed inset-0 bg-black/60 -z-10 pointer-events-none" />

    {/* CONTENT */}
    <div className="relative z-10 p-4 max-w-md mx-auto grid gap-4 pb-40">

        {/* MONTH FORM */}
        <Card className="bg-white/10 backdrop-blur-md text-black border-white/10">
          <CardContent className="p-4">
            <h2 className="font-bold">
              {editId ? "Edit Month" : "Create Month"}
            </h2>

            <Input className="text-white"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />

            <Input className="text-white"
              type="number"
              placeholder="Salary" 
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
            />

            <Button onClick={saveMonth} className="mt-2 w-full">
              {editId ? "Update Month" : "Save Month"}
            </Button>
          </CardContent>
        </Card>

        {/* MONTH LIST */}
        <Card className="bg-white/10  backdrop-blur-md text-black border-white/10">
          <CardContent className="p-4">
            <h2 className="font-bold">Months</h2>

            {monthsData.map((m) => (
              <div
                key={m.id}
                className="flex justify-between border-b border-white/10 py-2"
              >
                <div
                  onClick={() => selectMonth(m)}
                  className="cursor-pointer"
                >
                  {m.month} - {m.salary}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => startEditMonth(m)} className="text-blue-800 text-sm">
                    Edit
                  </button>

                  <button onClick={() => deleteMonth(m.id)} className="text-red-800 text-sm">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ACTIVE MONTH */}
        {activeMonth && (
          <>
            <Card className="bg-white  backdrop-blur-md text-black border-white/10">
              <CardContent className="p-4">
                <h2 className="font-bold">{activeMonth.month}</h2>

                <p>Salary: {activeMonth.salary}</p>
                <p>Total Expenses: {totalExpenses}</p>
                <p className="font-bold">Balance: {balance}</p>
              </CardContent>
            </Card>

            {/* EXPENSE FORM */}
            <Card className="bg-white backdrop-blur-md text-black border-white/10">
              <CardContent className="p-4">
                <h2 className="font-bold">Add Expense</h2>

                <Input
                
                  placeholder="Description"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />

                <Input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />

                <Button onClick={addExpense} className="mt-2 w-full">
                  Add Expense
                </Button>
              </CardContent>
            </Card>

            {/* HISTORY */}
            <Card className="bg-white backdrop-blur-md text-black border-white/10">
              <CardContent className="p-4">
                <h2 className="font-bold">Expense History</h2>

                {(activeMonth.expenses || []).length === 0 ? (
                  <p>No expenses yet</p>
                ) : (
                  activeMonth.expenses.map((e: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between border-b border-white/10 py-1"
                    >
                      <div>
                        <p>{e.desc}</p>
                        <p className="text-xs opacity-70">{e.date}</p>
                      </div>

                      <div className="flex gap-2 items-center">
                        <span>{e.amount}</span>

                        <button onClick={() => editExpense(i)} className="text-blue-800 text-sm">
                          Edit
                        </button>

                        <button onClick={() => deleteExpense(i)} className="text-red-800 text-sm">
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