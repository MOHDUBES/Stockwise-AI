import { API_BASE } from "./api";

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

export const formatNumber = (val: number, decimals = 1) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: decimals }).format(val);

export const clsx = (...classes: (string | undefined | false | null)[]) =>
  classes.filter(Boolean).join(" ");

export const RISK_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#3b9eff",
  low: "#00e5a0",
};

export const RISK_BADGE_CLASS: Record<string, string> = {
  critical: "badge badge-red",
  high: "badge badge-amber",
  medium: "badge badge-blue",
  low: "badge badge-green",
};

export const STOCK_STATUS_BADGE: Record<string, string> = {
  out_of_stock: "badge badge-red",
  low_stock: "badge badge-amber",
  warning: "badge badge-blue",
  in_stock: "badge badge-green",
};

export const STOCK_STATUS_LABEL: Record<string, string> = {
  out_of_stock: "Out of Stock",
  low_stock: "Low Stock",
  warning: "Warning",
  in_stock: "In Stock",
};

export const CHART_COLORS = [
  "#00e5a0", "#3b9eff", "#f59e0b", "#a855f7", "#ef4444",
  "#10b981", "#60a5fa", "#fbbf24", "#c084fc", "#f87171",
];
