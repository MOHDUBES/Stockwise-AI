export const API_BASE = "";

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// --- Inventory ---
export const getKPIs = () => request<any>("/api/v1/inventory/kpis");
export const getProducts = (params?: string) =>
  request<any>(`/api/v1/inventory${params ? "?" + params : ""}`);
export const getProduct = (id: string) => request<any>(`/api/v1/inventory/${id}`);
export const createProduct = (data: any) =>
  request<any>("/api/v1/inventory", { method: "POST", body: JSON.stringify(data) });
export const updateProduct = (id: string, data: any) =>
  request<any>(`/api/v1/inventory/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteProduct = (id: string) =>
  request<void>(`/api/v1/inventory/${id}`, { method: "DELETE" });

// --- Sales ---
export const getSalesTrend = (days = 30) =>
  request<any[]>(`/api/v1/sales/trend?days=${days}`);
export const getCategoryRevenue = () => request<any[]>("/api/v1/sales/category-revenue");
export const getSales = (params?: string) =>
  request<any>(`/api/v1/sales${params ? "?" + params : ""}`);

// --- Reorder ---
export const getReorderRecs = () => request<any[]>("/api/v1/reorder");
export const getUrgentReorders = () => request<any[]>("/api/v1/reorder/urgent");
export const getReorderSummary = () => request<any>("/api/v1/reorder/summary");

// --- Forecast ---
export const getProductForecast = (id: string, days = 30) =>
  request<any>(`/api/v1/forecast/${id}?horizon_days=${days}`);
export const getAllForecasts = (limit = 5) =>
  request<any[]>(`/api/v1/forecast?limit=${limit}`);

// --- Risk ---
export const getRiskScores = () => request<any[]>("/api/v1/risk");
export const getProductRisk = (id: string) => request<any>(`/api/v1/risk/${id}`);

// --- Benchmark ---
export const runBenchmark = (rows = 500000) =>
  request<any>(`/api/v1/benchmark/run?n_rows=${rows}`, { method: "POST" });
export const getBenchmarkOps = () => request<any[]>("/api/v1/benchmark/operations");

// --- Upload ---
export async function uploadInventoryCSV(file: File): Promise<any> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/v1/upload/inventory`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// --- Assistant ---
export const askAssistant = (query: string) =>
  request<any>("/api/v1/assistant/query", { method: "POST", body: JSON.stringify({ query }) });
export const confirmAssistantAction = (query: string, intent: any) =>
  request<any>("/api/v1/assistant/confirm", { method: "POST", body: JSON.stringify({ query, intent }) });
