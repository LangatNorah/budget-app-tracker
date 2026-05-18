"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, onSnapshot, updateDoc,
  doc, orderBy, serverTimestamp, deleteDoc, query,
} from "firebase/firestore";
import { v4 as uuid } from "uuid";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, History, Clock, Pencil } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ksh, type Month, type Expense, type Category } from "@/lib/utils";

const CATEGORIES: Category[] = ["Needs", "Wants", "Savings"];
const today = () => new Date().toLocaleDateString("en-KE");
const nowStamp = () => new Date().toISOString();
const formatStamp = (iso: string) =>
  new Date(iso).toLocaleString("en-KE", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

// ─── Stat row ─────────────────────────────────────────────────────────────────
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

  // Refs for scrolling
  const monthFormRef = useRef<HTMLDivElement>(null);
  const expenseFormRef = useRef<HTMLDivElement>(null);

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
  const [showHistory, setShowHistory] = useState(false);

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

  // ─── Keep activeMonth in sync ─────────────────────────────────────────────
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
    setTimeout(() => monthFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
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
            ? { ...e, desc, amount: Number(amount), category, editedAt: nowStamp() }
            : e
        )
      : [...expenses, { id: uuid(), desc, amount: Number(amount), category, date: today(), createdAt: nowStamp() }];

    await updateDoc(doc(db, "users", user.uid, "months", activeMonth.id), { expenses: updated });
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
    setTimeout(() => expenseFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const deleteExpense = async (id: string) => {
    if (!user?.uid || !activeMonth?.id) return;
    const updated = (activeMonth.expenses ?? []).filter((e) => e.id !== id);
    await updateDoc(doc(db, "users", user.uid, "months", activeMonth.id), { expenses: updated });
  };

  // ─── Calculations ─────────────────────────────────────────────────────────
  const totalExpenses = activeMonth?.expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
  const balance = Number(activeMonth?.salary ?? 0) - totalExpenses;

  if (!user) return null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-cover bg-center -z-20" style={{ backgroundImage: "url('/money-bg.jpg')" }} />
      <div className="fixed inset-0 bg-black/60 -z-10" />

      <div className="relative z-10 p-4 max-w-md mx-auto grid gap-4 pb-24 text-black">

        {/* ── Month form ─────────────────────────────────────────────────── */}
        <div ref={monthFormRef}>
          <Card>
            <CardContent className="p-4 grid gap-3">
              <h2 className="font-bold text-gray-800">
                {editMonthId ? "✏️ Edit Month" : "➕ Add Month"}
              </h2>

              <div>
                <label htmlFor="month-input" className="text-xs text-gray-500 mb-1 block">Month</label>
                <input
                  id="month-input"
                  type="month"
                  value={monthInput}
                  onChange={(e) => setMonthInput(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="salary-input" className="text-xs text-gray-500 mb-1 block">Salary (KES)</label>
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
                  {editMonthId ? "Update Month" : "Save Month"}
                </Button>
                {editMonthId && (
                  <Button variant="outline" onClick={() => { setEditMonthId(null); setMonthInput(""); setSalaryInput(""); }}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Month list ─────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-800">Months</h2>
              {monthsData.length > 0 && (
                <span className="text-xs text-gray-400 italic">Tap a month to view details</span>
              )}
            </div>

            {monthsData.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No months yet. Add one above.</p>
            ) : (
              monthsData.map((m) => {
                const isActive = activeMonth?.id === m.id;
                return (
                  <div
                    key={m.id}
                    className={`border-b last:border-0 transition-colors ${isActive ? "bg-blue-50 -mx-4 px-4" : ""}`}
                  >
                    <button
                      onClick={() => selectMonth(m)}
                      className="w-full flex items-center justify-between py-2.5 text-left gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{m.month}</p>
                        <p className="text-xs text-gray-500">{ksh(m.salary)}</p>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <span className="text-xs">{isActive ? "collapse" : "expand"}</span>
                        {isActive
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isActive && (
                      <div className="flex gap-3 pb-2.5 pl-1">
                        <button onClick={() => startEditMonth(m)} className="text-blue-600 text-xs font-medium hover:underline">
                          ✏️ Edit
                        </button>
                        <button onClick={() => deleteMonth(m.id)} className="text-red-500 text-xs font-medium hover:underline">
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* ── Active month detail ────────────────────────────────────────── */}
        {activeMonth && (
          <>
            {/* Summary */}
            <Card>
              <CardContent className="p-4">
                <h2 className="font-bold text-gray-800 mb-3">📅 {activeMonth.month}</h2>
                <StatRow label="Salary" value={activeMonth.salary} />
                <StatRow label="Total expenses" value={totalExpenses} />
                <StatRow label="Balance" value={balance} highlight />
              </CardContent>
            </Card>

            {/* Expense form */}
            <div ref={expenseFormRef}>
              <Card>
                <CardContent className="p-4 grid gap-3">
                  <h2 className="font-bold text-gray-800">
                    {editExpenseId ? "✏️ Edit Expense" : "➕ Add Expense"}
                  </h2>

                  <div>
                    <label htmlFor="exp-desc" className="text-xs text-gray-500 mb-1 block">Description</label>
                    <Input id="exp-desc" placeholder="e.g. Rent" value={desc} onChange={(e) => setDesc(e.target.value)} />
                  </div>

                  <div>
                    <label htmlFor="exp-amount" className="text-xs text-gray-500 mb-1 block">Amount (KES)</label>
                    <Input id="exp-amount" type="number" placeholder="e.g. 15000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>

                  <div>
                    <label htmlFor="exp-category" className="text-xs text-gray-500 mb-1 block">Category</label>
                    <select
                      id="exp-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={saveExpense} className="flex-1">
                      {editExpenseId ? "Update Expense" : "Add Expense"}
                    </Button>
                    {editExpenseId && (
                      <Button variant="outline" onClick={() => { setEditExpenseId(null); setDesc(""); setAmount(""); setCategory("Needs"); }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Expense history — single toggle */}
            <Card>
              <CardContent className="p-4">
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="w-full flex items-center justify-between mb-1"
                >
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <h2 className="font-bold text-gray-800">Expense History</h2>
                    {(activeMonth.expenses ?? []).length > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                        {(activeMonth.expenses ?? []).length}
                      </span>
                    )}
                  </div>
                  {showHistory
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {!showHistory ? (
                  <p className="text-xs text-gray-400 mt-1">
                    {(activeMonth.expenses ?? []).length === 0
                      ? "No expenses yet."
                      : `${(activeMonth.expenses ?? []).length} expense(s) — tap to view`}
                  </p>
                ) : (activeMonth.expenses ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No expenses yet.</p>
                ) : (
                  <div className="mt-2">
                    {(activeMonth.expenses ?? []).map((e, i) => (
                      <div key={e.id ?? i} className="flex items-start justify-between border-b last:border-0 py-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{e.desc}</p>
                          <p className="text-xs text-gray-400">{e.category} · {e.date}</p>
                          {/* ── Timestamps ── */}
                          {(e as any).createdAt && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                              Added {formatStamp((e as any).createdAt)}
                            </span>
                          )}
                          {(e as any).editedAt && (
                            <span className="flex items-center gap-1 text-[10px] text-blue-400">
                              <Pencil className="w-2.5 h-2.5 shrink-0" />
                              Edited {formatStamp((e as any).editedAt)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-gray-800 shrink-0">{ksh(e.amount)}</span>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => startEditExpense(e)} className="text-blue-600 text-xs hover:underline">✏️</button>
                          <button onClick={() => deleteExpense(e.id)} className="text-red-500 text-xs hover:underline">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
