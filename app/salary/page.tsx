"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, onSnapshot, updateDoc,
  doc, orderBy, serverTimestamp, deleteDoc, query,
} from "firebase/firestore";
import { v4 as uuid } from "uuid";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ksh, type Month, type Expense, type Category } from "@/lib/utils";

const CATEGORIES: Category[] = ["Needs", "Wants", "Savings"];

const today = () => new Date().toLocaleDateString("en-KE");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const isNegative = value < 0;
  return (
    <div className="flex justify-between items-center py-1.5 border-b last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? (isNegative ? "text-red-600" : "text-green-600") : "text-gray-800"}`}>
        {ksh(value)}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SalaryPage() {
  const user = useRequireAuth();

  // Month form
  const [monthInput, setMonthInput] = useState("");
  const [salaryInput, setSalaryInput] = useState("");
  const [editMonthId, setEditMonthId] = useState<string | null>(null);

  // Expense form
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Needs");
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);

  // Data
  const [monthsData, setMonthsData] = useState<Month[]>([]);
  const [activeMonth, setActiveMonth] = useState<Month | null>(null);

  // ─── Load months ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "users", user.uid, "months"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      const data: Month[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Month, "id">),
        expenses: d.data().expenses ?? [],
      }));
      setMonthsData(data);
    });
  }, [user?.uid]);

  // ─── Keep activeMonth in sync with live data ──────────────────────────────
  useEffect(() => {
    if (!activeMonth?.id) return;
    const fresh = monthsData.find((m) => m.id === activeMonth.id);
    if (fresh) setActiveMonth(fresh);
  }, [monthsData, activeMonth?.id]);

  // ─── Month CRUD ───────────────────────────────────────────────────────────
  const saveMonth = async () => {
    if (!user?.uid || !monthInput || !salaryInput) return;

    if (editMonthId) {
      await updateDoc(doc(db, "users", user.uid, "months", editMonthId), {
        month: monthInput,
        salary: Number(salaryInput),
      });
      setEditMonthId(null);
    } else {
      await addDoc(collection(db, "users", user.uid, "months"), {
        month: monthInput,
        salary: Number(salaryInput),
        expenses: [],
        createdAt: serverTimestamp(),
      });
    }

    setMonthInput("");
    setSalaryInput("");
  };

  const startEditMonth = (m: Month) => {
    setEditMonthId(m.id);
    setMonthInput(m.month);
    setSalaryInput(String(m.salary));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteMonth = async (id: string) => {
    if (!user?.uid) return;
    if (!confirm("Delete this month and all its expenses?")) return;
    await deleteDoc(doc(db, "users", user.uid, "months", id));
    if (activeMonth?.id === id) setActiveMonth(null);
  };

  const selectMonth = (m: Month) =>
    setActiveMonth((prev) => (prev?.id === m.id ? null : m));

  // ─── Expense CRUD ─────────────────────────────────────────────────────────
  const saveExpense = async () => {
    if (!user?.uid || !activeMonth?.id || !desc || !amount) return;

    const expenses = activeMonth.expenses ?? [];

    const updated = editExpenseId
      ? expenses.map((e) =>
          e.id === editExpenseId
            ? { ...e, desc, amount: Number(amount), category }
            : e
        )
      : [
          ...expenses,
          { id: uuid(), desc, amount: Number(amount), category, date: today() },
        ];

    await updateDoc(doc(db, "users", user.uid, "months", activeMonth.id), {
      expenses: updated,
    });

    setDesc("");
    setAmount("");
    setCategory("Needs");
    setEditExpenseId(null);
  };

  const startEditExpense = (e: Expense) => {
    setDesc(e.desc);
    setAmount(String(e.amount));
    setCategory(e.category);
    setEditExpenseId(e.id);
  };

  const deleteExpense = async (id: string) => {
    if (!user?.uid || !activeMonth?.id) return;
    const updated = (activeMonth.expenses ?? []).filter((e) => e.id !== id);
    await updateDoc(doc(db, "users", user.uid, "months", activeMonth.id), {
      expenses: updated,
    });
  };

  // ─── Calculations ─────────────────────────────────────────────────────────
  const totalExpenses =
    activeMonth?.expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
  const balance = Number(activeMonth?.salary ?? 0) - totalExpenses;

  if (!user) return null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen">

      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center -z-20"
        style={{ backgroundImage: "url('/money-bg.jpg')" }}
      />
      <div className="fixed inset-0 bg-black/60 -z-10" />

      <div className="relative z-10 p-4 max-w-md mx-auto grid gap-4 pb-24 text-black">

        {/* ── Month form ─────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4 grid gap-3">
            <h2 className="font-bold text-gray-800">
              {editMonthId ? "Edit Month" : "Add Month"}
            </h2>

            <div>
              <label htmlFor="month-input" className="text-xs text-gray-500 mb-1 block">
                Month
              </label>
              <input
                id="month-input"
                type="month"
                value={monthInput}
                onChange={(e) => setMonthInput(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="salary-input" className="text-xs text-gray-500 mb-1 block">
                Salary (KES)
              </label>
              <Input
                id="salary-input"
                type="number"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                placeholder="e.g. 50000"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveMonth} className="flex-1">
                {editMonthId ? "Update" : "Save Month"}
              </Button>
              {editMonthId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMonthId(null);
                    setMonthInput("");
                    setSalaryInput("");
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Month list ─────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-bold text-gray-800 mb-2">Months</h2>

            {monthsData.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No months yet. Add one above.</p>
            ) : (
              monthsData.map((m) => (
                <div
                  key={m.id}
                  className={`flex justify-between items-center border-b py-2 last:border-0 ${
                    activeMonth?.id === m.id ? "bg-blue-50 -mx-4 px-4 rounded" : ""
                  }`}
                >
                  <button
                    onClick={() => selectMonth(m)}
                    className="text-left flex-1"
                  >
                    <p className="text-sm font-medium">{m.month}</p>
                    <p className="text-xs text-gray-500">{ksh(m.salary)}</p>
                  </button>

                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => startEditMonth(m)}
                      className="text-blue-600 text-xs hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMonth(m.id)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ── Active month detail ────────────────────────────────────────── */}
        {activeMonth && (
          <>
            {/* Summary */}
            <Card>
              <CardContent className="p-4">
                <h2 className="font-bold text-gray-800 mb-3">{activeMonth.month}</h2>
                <StatRow label="Salary" value={activeMonth.salary} />
                <StatRow label="Total expenses" value={totalExpenses} />
                <StatRow label="Balance" value={balance} highlight />
              </CardContent>
            </Card>

            {/* Expense form */}
            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="font-bold text-gray-800">
                  {editExpenseId ? "Edit Expense" : "Add Expense"}
                </h2>

                <div>
                  <label htmlFor="exp-desc" className="text-xs text-gray-500 mb-1 block">
                    Description
                  </label>
                  <Input
                    id="exp-desc"
                    placeholder="e.g. Rent"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="exp-amount" className="text-xs text-gray-500 mb-1 block">
                    Amount (KES)
                  </label>
                  <Input
                    id="exp-amount"
                    type="number"
                    placeholder="e.g. 15000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="exp-category" className="text-xs text-gray-500 mb-1 block">
                    Category
                  </label>
                  <select
                    id="exp-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveExpense} className="flex-1">
                    {editExpenseId ? "Update Expense" : "Add Expense"}
                  </Button>
                  {editExpenseId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditExpenseId(null);
                        setDesc("");
                        setAmount("");
                        setCategory("Needs");
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Expense history */}
            <Card>
              <CardContent className="p-4">
                <h2 className="font-bold text-gray-800 mb-2">Expense History</h2>

                {(activeMonth.expenses ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No expenses yet.</p>
                ) : (
                  (activeMonth.expenses ?? []).map((e, i) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between border-b py-2 last:border-0 gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{e.desc}</p>
                        <p className="text-xs text-gray-500">
                          {e.category} · {e.date}
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-gray-800 shrink-0">
                        {ksh(e.amount)}
                      </span>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => startEditExpense(e)}
                          className="text-blue-600 text-xs hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteExpense(e.id)}
                          className="text-red-500 text-xs hover:underline"
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
