"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AlertTriangle, LogOut } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ksh, type Month, type Capital } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const BUDGET_RATIOS = { needs: 0.5, wants: 0.3, savings: 0.2 };
const COLORS = {
  needs: "#3b82f6",
  wants: "#f59e0b",
  savings: "#22c55e",
  capital: "#6366f1",
  sales: "#10b981",
  expenses: "#ef4444",
  profit: "#22c55e",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function BudgetLegendItem({
  label,
  color,
  spent,
  budget,
  percent,
}: {
  label: string;
  color: string;
  spent: number;
  budget: number;
  percent: number;
}) {
  const isOver = percent > 100;
  const isWarning = percent > 80;

  return (
    <div
      className="p-2 rounded-lg"
      style={{ borderLeft: `4px solid ${color}`, background: `${color}15` }}
    >
      <p className="font-medium text-xs">{label}</p>
      <p className={`text-xs ${isOver ? "text-red-600 font-bold" : isWarning ? "text-yellow-600" : ""}`}>
        {Math.min(percent, 999).toFixed(0)}% used
      </p>
      <p className="text-[10px] text-gray-500">
        {ksh(spent)} / {ksh(budget)}
      </p>
    </div>
  );
}

function HustleStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="p-2 rounded-lg"
      style={{ borderLeft: `4px solid ${color}`, background: `${color}15` }}
    >
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-sm font-semibold">{ksh(value)}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const user = useRequireAuth();

  const [months, setMonths] = useState<Month[]>([]);
  const [hustles, setHustles] = useState<Capital[]>([]);
  const [showWarning, setShowWarning] = useState(false);

  // ─── Firestore listeners ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const unsubMonths = onSnapshot(
      collection(db, "users", user.uid, "months"),
      (snap) =>
        setMonths(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Month, "id">),
            expenses: d.data().expenses ?? [],
          }))
        )
    );

    const unsubHustles = onSnapshot(
      query(collection(db, "hustleCapitals"), where("userId", "==", user.uid)),
      (snap) =>
        setHustles(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Capital, "id">),
            sales: d.data().sales ?? [],
            expenses: d.data().expenses ?? [],
          }))
        )
    );

    return () => {
      unsubMonths();
      unsubHustles();
    };
  }, [user?.uid]);

  // ─── Salary calculations ───────────────────────────────────────────────────
  const salaryTotal = months.reduce((s, m) => s + Number(m.salary || 0), 0);
  const allExpenses = months.flatMap((m) => m.expenses ?? []);

  const needsSpent = allExpenses
    .filter((e) => e.category === "Needs")
    .reduce((a, e) => a + Number(e.amount), 0);
  const wantsSpent = allExpenses
    .filter((e) => e.category === "Wants")
    .reduce((a, e) => a + Number(e.amount), 0);
  const savingsSpent = allExpenses
    .filter((e) => e.category === "Savings")
    .reduce((a, e) => a + Number(e.amount), 0);

  const needsBudget = salaryTotal * BUDGET_RATIOS.needs;
  const wantsBudget = salaryTotal * BUDGET_RATIOS.wants;
  const savingsBudget = salaryTotal * BUDGET_RATIOS.savings;

  const needsPct = needsBudget ? (needsSpent / needsBudget) * 100 : 0;
  const wantsPct = wantsBudget ? (wantsSpent / wantsBudget) * 100 : 0;
  const savingsPct = savingsBudget ? (savingsSpent / savingsBudget) * 100 : 0;

  // ─── Hustle calculations ───────────────────────────────────────────────────
  const hustleSales = hustles.reduce(
    (s, h) => s + h.sales.reduce((a, x) => a + Number(x.amount), 0),
    0
  );
  const hustleCapital = hustles.reduce((s, h) => s + Number(h.capital), 0);
  const hustleExpenses = hustles.reduce(
    (s, h) => s + h.expenses.reduce((a, e) => a + Number(e.amount), 0),
    0
  );
  const hustleProfit = hustleSales - hustleExpenses - hustleCapital;

  // ─── Chart data ────────────────────────────────────────────────────────────
  const budgetChartData = [
    { name: "Needs", value: Math.max(needsBudget - needsSpent, 0), color: COLORS.needs },
    { name: "Wants", value: Math.max(wantsBudget - wantsSpent, 0), color: COLORS.wants },
    { name: "Savings", value: Math.max(savingsBudget - savingsSpent, 0), color: COLORS.savings },
  ];

  const hustleChartData = [
    { name: "Capital", value: hustleCapital, color: COLORS.capital },
    { name: "Sales", value: hustleSales, color: COLORS.sales },
    { name: "Expenses", value: hustleExpenses, color: COLORS.expenses },
    { name: "Profit", value: Math.max(hustleProfit, 0), color: COLORS.profit },
  ];

  const isOverspending = needsPct > 80 || wantsPct > 80;

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) return null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen">

      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center -z-20"
        style={{ backgroundImage: "url('/money-bg.jpg')" }}
      />
      <div className="fixed inset-0 bg-black/60 -z-10" />

      <div className="relative z-10 max-w-6xl mx-auto p-4">

        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-white text-xl font-bold">Budget Dashboard</h1>

          <div className="flex items-center gap-3">
            {isOverspending && (
              <button
                aria-label="Toggle spending warning"
                onClick={() => setShowWarning((v) => !v)}
              >
                <AlertTriangle className="w-6 h-6 text-red-400 hover:text-red-300 animate-pulse" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Warning banner */}
        {isOverspending && showWarning && (
          <div
            role="alert"
            aria-live="polite"
            className="bg-red-500 text-white px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            You are overspending in one or more budget categories.
          </div>
        )}

        {/* Dashboard grid */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Salary card */}
          <div className="bg-white/90 backdrop-blur p-5 rounded-2xl">
            <h2 className="text-sm font-semibold text-gray-600 mb-1">
              💰 Salary Budget (50 / 30 / 20)
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Total salary: {ksh(salaryTotal)}
            </p>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={budgetChartData} dataKey="value" outerRadius={80} innerRadius={52}>
                  {budgetChartData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => (typeof v === "number" ? ksh(v) : "")} />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <BudgetLegendItem label="Needs" color={COLORS.needs} spent={needsSpent} budget={needsBudget} percent={needsPct} />
              <BudgetLegendItem label="Wants" color={COLORS.wants} spent={wantsSpent} budget={wantsBudget} percent={wantsPct} />
              <BudgetLegendItem label="Savings" color={COLORS.savings} spent={savingsSpent} budget={savingsBudget} percent={savingsPct} />
            </div>
          </div>

          {/* Hustle card */}
          <div className="bg-white/90 backdrop-blur p-5 rounded-2xl">
            <h2 className="text-sm font-semibold text-gray-600 mb-1">
              💼 Hustle Performance
            </h2>
            <p className={`text-xs mb-3 font-medium ${hustleProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
              {hustleProfit >= 0 ? `Profit: ${ksh(hustleProfit)}` : `Loss: ${ksh(Math.abs(hustleProfit))}`}
            </p>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={hustleChartData} dataKey="value" outerRadius={80} innerRadius={52}>
                  {hustleChartData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
               <Tooltip formatter={(v) => (typeof v === "number" ? ksh(v) : "")} />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <HustleStat label="Capital" value={hustleCapital} color={COLORS.capital} />
              <HustleStat label="Sales" value={hustleSales} color={COLORS.sales} />
              <HustleStat label="Expenses" value={hustleExpenses} color={COLORS.expenses} />
              <HustleStat label="Profit / Loss" value={hustleProfit} color={hustleProfit >= 0 ? COLORS.profit : COLORS.expenses} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
