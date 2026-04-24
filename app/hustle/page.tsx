"use client";

import { useEffect, useState } from "react";
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

/* ================= TYPES ================= */

type Sale = {
  buyer: string;
  amount: number;
  date: string;
};

type Expense = {
  desc: string;
  amount: number;
  date: string;
};

type Capital = {
  id: string;
  name: string;
  capital: number;
  sales: Sale[];
  expenses: Expense[];
};

/* ================= COMPONENT ================= */

export default function HustlePage() {
  /* CAPITAL */
  const [capitalName, setCapitalName] = useState("");
  const [capitalAmount, setCapitalAmount] = useState("");
  const [editCapitalId, setEditCapitalId] = useState<string | null>(null);

  /* SALES */
  const [buyer, setBuyer] = useState("");
  const [amount, setAmount] = useState("");
  const [editSaleIndex, setEditSaleIndex] = useState<number | null>(null);

  /* EXPENSES */
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [editExpIndex, setEditExpIndex] = useState<number | null>(null);

  /* DATA */
  const [capitals, setCapitals] = useState<Capital[]>([]);
  const [activeCapital, setActiveCapital] = useState<Capital | null>(null);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    const q = query(
      collection(db, "hustleCapitals"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data: Capital[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Capital, "id">),
        sales: d.data().sales || [],
        expenses: d.data().expenses || [],
      }));

      setCapitals(data);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activeCapital?.id) return;

    const updated = capitals.find((c) => c.id === activeCapital.id);
    if (updated) setActiveCapital(updated);
  }, [capitals, activeCapital?.id]);

  /* ================= CAPITAL ================= */

  const saveCapital = async () => {
    if (!capitalName || !capitalAmount) return;

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
        createdAt: serverTimestamp(),
      });
    }

    setCapitalName("");
    setCapitalAmount("");
  };

  const deleteCapital = async (id: string) => {
    await deleteDoc(doc(db, "hustleCapitals", id));
    if (activeCapital?.id === id) setActiveCapital(null);
  };

  const startEditCapital = (c: Capital) => {
    setCapitalName(c.name);
    setCapitalAmount(String(c.capital));
    setEditCapitalId(c.id);
  };

  const selectCapital = (c: Capital) => setActiveCapital(c);

  /* ================= SALES ================= */

  const saveSale = async () => {
    if (!activeCapital || !buyer || !amount) return;

    const list = activeCapital.sales || [];

    const updated =
      editSaleIndex !== null
        ? list.map((s, i) =>
            i === editSaleIndex
              ? { ...s, buyer, amount: Number(amount) }
              : s
          )
        : [
            ...list,
            {
              buyer,
              amount: Number(amount),
              date: new Date().toLocaleDateString(),
            },
          ];

    await updateDoc(doc(db, "hustleCapitals", activeCapital.id), {
      sales: updated,
    });

    setBuyer("");
    setAmount("");
    setEditSaleIndex(null);
  };

  const editSale = (i: number) => {
    if (!activeCapital) return;

    const s = activeCapital.sales[i];
    setBuyer(s.buyer);
    setAmount(String(s.amount));
    setEditSaleIndex(i);
  };

  const deleteSale = async (i: number) => {
    if (!activeCapital) return;

    const updated = activeCapital.sales.filter((_, x) => x !== i);

    await updateDoc(doc(db, "hustleCapitals", activeCapital.id), {
      sales: updated,
    });
  };

  /* ================= EXPENSES ================= */

  const saveExpense = async () => {
    if (!activeCapital || !expDesc || !expAmount) return;

    const list = activeCapital.expenses || [];

    const updated =
      editExpIndex !== null
        ? list.map((e, i) =>
            i === editExpIndex
              ? { ...e, desc: expDesc, amount: Number(expAmount) }
              : e
          )
        : [
            ...list,
            {
              desc: expDesc,
              amount: Number(expAmount),
              date: new Date().toLocaleDateString(),
            },
          ];

    await updateDoc(doc(db, "hustleCapitals", activeCapital.id), {
      expenses: updated,
    });

    setExpDesc("");
    setExpAmount("");
    setEditExpIndex(null);
  };

  const editExpense = (i: number) => {
    if (!activeCapital) return;

    const e = activeCapital.expenses[i];
    setExpDesc(e.desc);
    setExpAmount(String(e.amount));
    setEditExpIndex(i);
  };

  const deleteExpense = async (i: number) => {
    if (!activeCapital) return;

    const updated = activeCapital.expenses.filter((_, x) => x !== i);

    await updateDoc(doc(db, "hustleCapitals", activeCapital.id), {
      expenses: updated,
    });
  };

  /* ================= CALCULATIONS ================= */

  const totalSales =
    activeCapital?.sales.reduce((s, i) => s + Number(i.amount || 0), 0) || 0;

  const totalExpenses =
    activeCapital?.expenses.reduce((s, i) => s + Number(i.amount || 0), 0) || 0;

  const net = totalSales - totalExpenses;
  const capital = activeCapital?.capital || 0;

  const profit = net >= capital ? net - capital : 0;
  const remaining = capital - net;

  /* ================= UI ================= */

   return (
    <div className="relative min-h-screen text-white">

      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/money-bg.jpg')" }}
      />

      <div className="fixed inset-0 bg-black/60" />

      <div className="relative z-10 p-4 max-w-md mx-auto grid gap-4 pb-24">

        {/* CAPITAL FORM */}
        <Card className="bg-white/10 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <h2 className="font-bold">Capital</h2>

            <Input
              placeholder="Name"
              value={capitalName}
              onChange={(e) => setCapitalName(e.target.value)}
              className="text-white/70"
            />

            <Input
              type="number"
              placeholder="Amount"
              value={capitalAmount}
              onChange={(e) => setCapitalAmount(e.target.value)}
              className="text-white/70"
            />

            <Button onClick={saveCapital} className="mt-2 w-full">
              {editCapitalId ? "Update Capital" : "Save Capital"}
            </Button>
          </CardContent>
        </Card>

        {/* CAPITAL LIST */}
        <Card className="bg-white/10 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <h2 className="font-bold">Capitals</h2>

            {capitals.map((c) => (
              <div key={c.id} className="flex justify-between border-b py-2">
                <div onClick={() => selectCapital(c)} className="cursor-pointer">
                  {c.name} - {c.capital}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => startEditCapital(c)} className="text-blue-300 text-sm">
                    Edit
                  </button>

                  <button onClick={() => deleteCapital(c.id)} className="text-red-300 text-sm">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      {/* ACTIVE CAPITAL */}
      {activeCapital && (
        <>
          <Card className="bg-white/10 backdrop-blur-md text-black border-white/10">
            <CardContent className="p-4">
              <h2 className="font-bold">{activeCapital.name}</h2>

              <p>Capital: {capital}</p>
              <p>Sales: {totalSales}</p>
              <p>Expenses: {totalExpenses}</p>

              <p className="font-bold">
                {net >= capital
                  ? `Profit: ${profit}`
                  : `Remaining: ${remaining}`}
              </p>
            </CardContent>
          </Card>

          {/* SALES */}
          <Card className="bg-white/10 backdrop-blur-md text-black border-white/10">
            <CardContent className="p-4">
              <h2 className="font-bold">Add Sale</h2>

              <Input
                placeholder="Buyer"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                className="text-white"
              />

              <Input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-white"
              />

              <Button onClick={saveSale} className="mt-2 w-full">
                {editSaleIndex !== null ? "Update Sale" : "Add Sale"}
              </Button>
            </CardContent>
          </Card>

          {/* SALES HISTORY */}
<Card className="bg-white/10 backdrop-blur-md text-black border-white/10">
  <CardContent className="p-4">
    <h2 className="font-bold">Sales History</h2>

    {(activeCapital.sales || []).length === 0 ? (
      <p>No sales yet</p>
    ) : (
      activeCapital.sales.map((s, i) => (
        <div key={i} className="flex justify-between border-b py-1">
          <span>
            {s.buyer} ({s.date}) - {s.amount}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => editSale(i)}
              className="text-blue-800 text-sm"
            >
              Edit
            </button>

            <button
              onClick={() => deleteSale(i)}
              className="text-red-800 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ))
    )}
  </CardContent>
</Card>

          {/* EXPENSES */}
          <Card className="bg-white/10 backdrop-blur-md text-black border-white/10">
            <CardContent className="p-4">
              <h2 className="font-bold">Add Expense</h2>

              <Input
                placeholder="Description"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                className="text-white"
              />

              <Input
                type="number"
                placeholder="Amount"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                className="text-white"
              />

              <Button onClick={saveExpense} className="mt-2 w-full">
                {editExpIndex !== null ? "Update Expense" : "Add Expense"}
              </Button>
            </CardContent>
          </Card>

          {/* EXPENSE HISTORY */}
<Card className="bg-white/10 backdrop-blur-md text-black border-white/10">
  <CardContent className="p-4">
    <h2 className="font-bold">Expense History</h2>

    {(activeCapital.expenses || []).length === 0 ? (
      <p>No expenses yet</p>
    ) : (
      activeCapital.expenses.map((e, i) => (
        <div key={i} className="flex justify-between border-b py-1">
          <span>
            {e.desc} ({e.date}) - {e.amount}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => editExpense(i)}
              className="text-blue-800 text-sm"
            >
              Edit
            </button>

            <button
              onClick={() => deleteExpense(i)}
              className="text-red-800 text-sm"
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