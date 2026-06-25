import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(ts: number | string | null | undefined): string {
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB"];
  const i = Math.min(Math.floor(Math.log2(bytes) / 10), units.length - 1);
  const value = bytes / (1 << (i * 10));
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}
