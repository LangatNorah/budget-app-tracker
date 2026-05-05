"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, onSnapshot, updateDoc,
  doc, query, serverTimestamp, deleteDoc, where,
} from "firebase/firestore";
import { v4 as uuid } from "uuid";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ksh, type Capital, type Sale, type HustleExpense } from "@/lib/utils";

const today = () => new Date().toLocaleDateString("en-KE");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const isNegative = value < 0;
  return (
    <div className="flex justify-between items-center py-1.5 border-b last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`text-sm font-semibold ${
          highlight
            ? isNegative
              ? "text-red-600"
              : "text-green-600"
            : "text-gray-800"
        }`}
      >
        {ksh(value)}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HustlePage() {
  const user = useRequireAuth();

  // Capital form
  const [capitalName, setCapitalName] = useState("");
  const [capitalAmount, setCapitalAmount] = useState("");
  const [editCapitalId, setEditCapitalId] = useState<string | null>(null);

  // Sale form
  const [buyer, setBuyer] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [editSaleId, setEditSaleId] = useState<string | null>(null);

  // Expense form
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [editExpId, setEditExpId] = useState<string | null>(null);

  // Data
  const [capitals, setCapitals] = useState<Capital[]>([]);
  const [activeCapital, setActiveCapital] = useState<Capital | null>(null);

  // ─── Load hustles ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "hustleCapitals"),
      where("userId", "==", user.uid)
    );

    return onSnapshot(q, (snap) => {
      const data: Capital[] = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Capital, "id">),
          sales: d.data().sales ?? [],
          expenses: d.data().expenses ?? [],
        }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));

      setCapitals(data);
    });
  }, [user?.uid]);

  // ─── Keep activeCapital in sync ───────────────────────────────────────────
  useEffect(() => {
    if (!activeCapital?.id) return;
    const fresh = capitals.find((c) => c.id === activeCapital.id);
    if (fresh) setActiveCapital(fresh);
  }, [capitals, activeCapital?.id]);

  // ─── Capital CRUD ─────────────────────────────────────────────────────────
  const saveCapital = async () => {
    if (!user?.uid || !capitalName || !capitalAmount) return;

    if (editCapitalId) {
      await updateDoc(doc(db, "hustleCapitals", editCapitalId), {
        name: capitalName,
        capital: Number(capitalAmount),
      });
      setEditCapitalId(null);
    } else {
      await addDoc(collection(db, "hustleCapitals"), {
        name: capitalName,
        capital: Number(capitalAmount),
        sales: [],
        expenses: [],
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    }

    setCapitalName("");
    setCapitalAmount("");
  };

  const startEditCapital = (c: Capital) => {
    setCapitalName(c.name);
    setCapitalAmount(String(c.capital));
    setEditCapitalId(c.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteCapital = async (id: string) => {
    if (!confirm("Delete this hustle and all its data?")) return;
    await deleteDoc(doc(db, "hustleCapitals", id));
    if (activeCapital?.id === id) setActiveCapital(null);
  };

  const selectCapital = (c: Capital) =>
    setActiveCapital((prev) => (prev?.id === c.id ? null : c));

  // ─── Sale CRUD ────────────────────────────────────────────────────────────
  const saveSale = async () => {
    if (!activeCapital || !buyer || !saleAmount) return;

    const sales = activeCapital.sales ?? [];
    const updated = editSaleId
      ? sales.map((s) =>
          s.id === editSaleId
            ? { ...s, buyer, amount: Number(saleAmount) }
            : s
        )
      : [...sales, { id: uuid(), buyer, amount: Number(saleAmount), date: today() }];

    await updateDoc(doc(db, "hustleCapitals", activeCapital.id), { sales: updated });
    setBuyer("");
    setSaleAmount("");
    setEditSaleId(null);
  };

  const startEditSale = (s: Sale) => {
    setBuyer(s.buyer);
    setSaleAmount(String(s.amount));
    setEditSaleId(s.id);
  };

  const deleteSale = async (id: string) => {
    if (!activeCapital) return;
    const updated = activeCapital.sales.filter((s) => s.id !== id);
    await updateDoc(doc(db, "hustleCapitals", activeCapital.id), { sales: updated });
  };

  // ─── Expense CRUD ─────────────────────────────────────────────────────────
  const saveExpense = async () => {
    if (!activeCapital || !expDesc || !expAmount) return;

    const expenses = activeCapital.expenses ?? [];
    const updated = editExpId
      ? expenses.map((e) =>
          e.id === editExpId
            ? { ...e, desc: expDesc, amount: Number(expAmount) }
            : e
        )
      : [...expenses, { id: uuid(), desc: expDesc, amount: Number(expAmount), date: today() }];

    await updateDoc(doc(db, "hustleCapitals", activeCapital.id), { expenses: updated });
    setExpDesc("");
    setExpAmount("");
    setEditExpId(null);
  };

  const startEditExpense = (e: HustleExpense) => {
    setExpDesc(e.desc);
    setExpAmount(String(e.amount));
    setEditExpId(e.id);
  };

  const deleteExpense = async (id: string) => {
    if (!activeCapital) return;
    const updated = activeCapital.expenses.filter((e) => e.id !== id);
    await updateDoc(doc(db, "hustleCapitals", activeCapital.id), { expenses: updated });
  };

  // ─── Calculations ─────────────────────────────────────────────────────────
  const totalSales = activeCapital?.sales.reduce((s, i) => s + Number(i.amount), 0) ?? 0;
  const totalExpenses = activeCapital?.expenses.reduce((s, i) => s + Number(i.amount), 0) ?? 0;
  const capital = activeCapital?.capital ?? 0;
  const profit = totalSales - totalExpenses - capital;

  if (!user) return null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen text-black">

      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-20"
        style={{ backgroundImage: "url('/money-bg.jpg')" }}
      />
      <div className="fixed inset-0 bg-black/60 -z-10" />

      <div className="relative z-10 p-4 max-w-md mx-auto grid gap-4 pb-24">

        {/* ── Capital form ───────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4 grid gap-3">
            <h2 className="font-bold text-gray-800">
              {editCapitalId ? "Edit Hustle" : "Add Hustle"}
            </h2>

            <div>
              <label htmlFor="cap-name" className="text-xs text-gray-500 mb-1 block">
                Hustle name
              </label>
              <Input
                id="cap-name"
                placeholder="e.g. Maize selling"
                value={capitalName}
                onChange={(e) => setCapitalName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="cap-amount" className="text-xs text-gray-500 mb-1 block">
                Capital invested (KES)
              </label>
              <Input
                id="cap-amount"
                type="number"
                placeholder="e.g. 5000"
                value={capitalAmount}
                onChange={(e) => setCapitalAmount(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveCapital} className="flex-1">
                {editCapitalId ? "Update" : "Save Hustle"}
              </Button>
              {editCapitalId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditCapitalId(null);
                    setCapitalName("");
                    setCapitalAmount("");
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Capital list ───────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-bold text-gray-800 mb-2">My Hustles</h2>

            {capitals.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No hustles yet. Add one above.</p>
            ) : (
              capitals.map((c, i) => (
                <div
                  key={c.id}
                  className={`flex justify-between items-center border-b py-2 last:border-0 ${
                    activeCapital?.id === c.id ? "bg-indigo-50 -mx-4 px-4 rounded" : ""
                  }`}
                >
                  <button onClick={() => selectCapital(c)} className="text-left flex-1">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">Capital: {ksh(c.capital)}</p>
                  </button>

                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => startEditCapital(c)}
                      className="text-blue-600 text-xs hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCapital(c.id)}
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

        {/* ── Active capital detail ──────────────────────────────────────── */}
        {activeCapital && (
          <>
            {/* Summary */}
            <Card>
              <CardContent className="p-4">
                <h2 className="font-bold text-gray-800 mb-3">{activeCapital.name}</h2>
                <StatRow label="Capital" value={capital} />
                <StatRow label="Total sales" value={totalSales} />
                <StatRow label="Total expenses" value={totalExpenses} />
                <StatRow
                  label={profit >= 0 ? "Profit" : "Loss"}
                  value={profit}
                  highlight
                />
              </CardContent>
            </Card>

            {/* ── Sales form ───────────────────────────────────────────── */}
            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="font-bold text-gray-800">
                  {editSaleId ? "Edit Sale" : "Add Sale"}
                </h2>

                <div>
                  <label htmlFor="sale-buyer" className="text-xs text-gray-500 mb-1 block">
                    Buyer name
                  </label>
                  <Input
                    id="sale-buyer"
                    placeholder="e.g. Jane"
                    value={buyer}
                    onChange={(e) => setBuyer(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="sale-amount" className="text-xs text-gray-500 mb-1 block">
                    Amount (KES)
                  </label>
                  <Input
                    id="sale-amount"
                    type="number"
                    placeholder="e.g. 2000"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveSale} className="flex-1">
                    {editSaleId ? "Update Sale" : "Add Sale"}
                  </Button>
                  {editSaleId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditSaleId(null);
                        setBuyer("");
                        setSaleAmount("");
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sales history */}
            <Card>
              <CardContent className="p-4">
                <h2 className="font-bold text-gray-800 mb-2">Sales History</h2>

                {activeCapital.sales.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No sales yet.</p>
                ) : (
                  activeCapital.sales.map((s, i) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between border-b py-2 last:border-0 gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.buyer}</p>
                        <p className="text-xs text-gray-500">{s.date}</p>
                      </div>

                      <span className="text-sm font-semibold text-gray-800 shrink-0">
                        {ksh(s.amount)}
                      </span>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => startEditSale(s)}
                          className="text-blue-600 text-xs hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSale(s.id)}
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

            {/* ── Expense form ─────────────────────────────────────────── */}
            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="font-bold text-gray-800">
                  {editExpId ? "Edit Expense" : "Add Expense"}
                </h2>

                <div>
                  <label htmlFor="exp-desc" className="text-xs text-gray-500 mb-1 block">
                    Description
                  </label>
                  <Input
                    id="exp-desc"
                    placeholder="e.g. Transport"
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="exp-amount" className="text-xs text-gray-500 mb-1 block">
                    Amount (KES)
                  </label>
                  <Input
                    id="exp-amount"
                    type="number"
                    placeholder="e.g. 500"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveExpense} className="flex-1">
                    {editExpId ? "Update Expense" : "Add Expense"}
                  </Button>
                  {editExpId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditExpId(null);
                        setExpDesc("");
                        setExpAmount("");
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

                {activeCapital.expenses.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No expenses yet.</p>
                ) : (
                  activeCapital.expenses.map((e, i) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between border-b py-2 last:border-0 gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{e.desc}</p>
                        <p className="text-xs text-gray-500">{e.date}</p>
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
