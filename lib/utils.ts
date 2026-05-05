import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuid } from "uuid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// ─── Currency formatter ───────────────────────────────────────
export const ksh = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);

// ─── Shared types ─────────────────────────────────────────────
export type Category = "Needs" | "Wants" | "Savings";

export type Expense = {
  id: string;
  desc: string;
  amount: number;
  date: string;
  category: Category;
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
};

export type HustleExpense = {
  id: string;
  desc: string;
  amount: number;
  date: string;
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