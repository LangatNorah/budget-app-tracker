import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Tailwind class merge helper ──────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency formatter ───────────────────────────────────────────────────────
export const ksh = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);

// ─── Timestamp helpers ────────────────────────────────────────────────────────
export const nowStamp = () => new Date().toISOString();

export const formatStamp = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ─── Shared types ─────────────────────────────────────────────────────────────
export type Category = "Needs" | "Wants" | "Savings";

export type Expense = {
  id: string;
  desc: string;
  amount: number;
  date: string;
  category: Category;
  createdAt: string;
  editedAt?: string;
};

export type Month = {
  id: string;
  month: string;
  salary: number;
  expenses: Expense[];
  createdAt?: { seconds: number };
};

export type Sale = {
  id: string;
  buyer: string;
  amount: number;
  date: string;
  createdAt: string;
  editedAt?: string;
};

export type HustleExpense = {
  id: string;
  desc: string;
  amount: number;
  date: string;
  createdAt: string;
  editedAt?: string;
};

export type Capital = {
  id: string;
  name: string;
  capital: number;
  sales: Sale[];
  expenses: HustleExpense[];
  userId: string;
  createdAt?: { seconds: number };
};