import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const fmt = {
  currency: (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v),
  number: (v) => new Intl.NumberFormat("en-US").format(v),
  pct: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`,
  date: (d) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d)),
  shortDate: (d) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(d)),
};

export function initials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function randomColor(seed) {
  const colors = ["bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500","bg-pink-500","bg-teal-500","bg-indigo-500","bg-rose-500"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}
