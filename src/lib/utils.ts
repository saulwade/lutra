import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "—";
  return value.toFixed(decimals);
}

export function formatKcal(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value)} kcal`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}
