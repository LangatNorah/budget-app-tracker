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

export default function HustlePage() {
  // CAPITAL
  const [capitalName, setCapitalName] = useState("");
  const [capitalAmount, setCapitalAmount] = useState("");
  const [editCapitalId, setEditCapitalId] = useState(null);

  // SALES
  const [buyer, setBuyer] = useState("");
  const [amount, setAmount] = useState("");
  const [editSaleIndex, setEditSaleIndex] = useState(null);

  // EXPENSES
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [editExpIndex, setEditExpIndex] = useState(null);

  const [capitals, setCapitals] = useState([]);
  const [activeCapital, setActiveCapital] = useState(null);

  // ================= LOAD DATA =================
  useEffect(() => {
    const q = query(
      collection(db, "hustleCapitals"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
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
  }, [capitals]);

  // ================= CAPITAL =================
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

  const deleteCapital = async (id) => {
    await deleteDoc(doc(db, "hustleCapitals", id));
    if (activeCapital?.id === id) setActiveCapital(null);
  };

  const startEditCapital = (c) => {
    setCapitalName(c.name);
    setCapitalAmount(c.capital);
    setEditCapitalId(c.id);
  };

  const selectCapital = (c) => setActiveCapital(c);

  // ================= SALES =================
  const saveSale = async () => {
    if (!activeCapital?.id || !buyer || !amount) return;

    const list = activeCapital.sales || [];

    let updated;

    if (editSaleIndex !== null) {
      updated = list.map((s, i) =>
        i === editSaleIndex
          ? { ...s, buyer, amount: Number(amount) }
          : s
      );
    } else {
      updated = [
        ...list,
        {
          buyer,
          amount: Number(amount),
          date: new Date().toLocaleDateString(),
        },
      ];
    }

    await updateDoc(doc(db, "hustleCapitals", activeCapital.id), {
      sales: updated,
    });

    setBuyer("");
    setAmount("");
    setEditSaleIndex(null);
  };

  const editSale = (i) => {
    const s = activeCapital.sales[i];
    setBuyer(s.buyer);
    setAmount(s.amount);
    setEditSaleIndex(i);
  };

  const deleteSale = async (i) => {
    const updated = activeCapital.sales.filter((_, x) => x !== i);

    await updateDoc(doc(db, "hustleCapitals", activeCapital.id), {
      sales: updated,
    });
  };

  // ================= EXPENSES =================
  const saveExpense = async () => {
    if (!activeCapital?.id || !expDesc || !expAmount) return;

    const list = activeCapital.expenses || [];

    let updated;

    if (editExpIndex !== null) {
      updated = list.map((e, i) =>
        i === editExpIndex
          ? { ...e, desc: expDesc, amount: Number(expAmount) }
          : e
      );
    } else {
      updated = [
        ...list,
        {
          desc: expDesc,
          amount: Number(expAmount),
          date: new Date().toLocaleDateString(),
        },
      ];
    }

    await updateDoc(doc(db, "hustleCapitals", activeCapital.id), {
      expenses: updated,
    });

    setExpDesc("");
    setExpAmount("");
    setEditExpIndex(null);
  };

  const editExpense = (i) => {
    const e = activeCapital.expenses[i];
    setExpDesc(e.desc);
    setExpAmount(e.amount);
    setEditExpIndex(i);
  };

  const deleteExpense = async (i) => {
    const updated = activeCapital.expenses.filter((_, x) => x !== i);

    await updateDoc(doc(db, "hustleCapitals", activeCapital.id), {
      expenses: updated,
    });
  };

  // ================= CALCULATIONS =================
  const totalSales =
    activeCapital?.sales?.reduce((s, i) => s + Number(i.amount || 0), 0) || 0;

  const totalExpenses =
    activeCapital?.expenses?.reduce((s, i) => s + Number(i.amount || 0), 0) || 0;

  const net = totalSales - totalExpenses;

  const capital = activeCapital?.capital || 0;

  const profit = net >= capital ? net - capital : 0;

  const remaining = capital - net;

  // ================= UI =================
  return (
    <div className="p-4 max-w-md mx-auto grid gap-4 pb-24">

      {/* CAPITAL FORM */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-bold">Capital</h2>

          <Input
            placeholder="Name"
            value={capitalName}
            onChange={(e) => setCapitalName(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Amount"
            value={capitalAmount}
            onChange={(e) => setCapitalAmount(e.target.value)}
          />

          <Button onClick={saveCapital} className="mt-2 w-full">
            {editCapitalId ? "Update Capital" : "Save Capital"}
          </Button>
        </CardContent>
      </Card>

      {/* CAPITAL LIST */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-bold">Capitals</h2>

          {capitals.map((c) => (
            <div key={c.id} className="flex justify-between border-b py-2">
              <div onClick={() => selectCapital(c)} className="cursor-pointer">
                {c.name} - {c.capital}
              </div>

              <div className="flex gap-2">
                <button onClick={() => startEditCapital(c)} className="text-blue-500 text-sm">Edit</button>
                <button onClick={() => deleteCapital(c.id)} className="text-red-500 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ACTIVE CAPITAL */}
      {activeCapital && (
        <>
          {/* SUMMARY */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-bold">{activeCapital.name}</h2>

              <p>Capital: {capital}</p>
              <p>Sales: {totalSales}</p>
              <p>Expenses: {totalExpenses}</p>

              <p className="font-bold">
                {net >= capital ? `Profit: ${profit}` : `Remaining: ${remaining}`}
              </p>
            </CardContent>
          </Card>

          {/* SALES INPUT */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-bold">Add Sale</h2>

              <Input
                placeholder="Buyer"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
              />

              <Input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <Button onClick={saveSale} className="mt-2 w-full">
                {editSaleIndex !== null ? "Update Sale" : "Add Sale"}
              </Button>
            </CardContent>
          </Card>

          {/* SALES HISTORY CARD */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-bold">Sales History</h2>

              {activeCapital.sales.length === 0 ? (
                <p>No sales yet</p>
              ) : (
                activeCapital.sales.map((s, i) => (
                  <div key={i} className="flex justify-between border-b py-1">
                    <span>{s.buyer} ({s.date}) - {s.amount}</span>

                    <div className="flex gap-2">
                      <button onClick={() => editSale(i)} className="text-blue-500 text-sm">Edit</button>
                      <button onClick={() => deleteSale(i)} className="text-red-500 text-sm">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* EXPENSE INPUT */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-bold">Add Expense</h2>

              <Input
                placeholder="Description"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
              />

              <Input
                type="number"
                placeholder="Amount"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
              />

              <Button onClick={saveExpense} className="mt-2 w-full">
                {editExpIndex !== null ? "Update Expense" : "Add Expense"}
              </Button>
            </CardContent>
          </Card>

          {/* EXPENSE HISTORY CARD */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-bold">Expense History</h2>

              {activeCapital.expenses.length === 0 ? (
                <p>No expenses yet</p>
              ) : (
                activeCapital.expenses.map((e, i) => (
                  <div key={i} className="flex justify-between border-b py-1">
                    <span>{e.desc} ({e.date}) - {e.amount}</span>

                    <div className="flex gap-2">
                      <button onClick={() => editExpense(i)} className="text-blue-500 text-sm">Edit</button>
                      <button onClick={() => deleteExpense(i)} className="text-red-500 text-sm">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}