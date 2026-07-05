"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Package, AlertTriangle, TrendingUp, DollarSign,
  ShoppingCart, ArrowRight, Zap, Store,
} from "lucide-react";
import Link from "next/link";
import { getKPIs, getSalesTrend, getCategoryRevenue, getUrgentReorders } from "@/lib/api";
import { KpiCard } from "@/components/ui/KpiCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Mascot, MascotEmotion } from "@/components/ui/Mascot";
import { formatCurrency, formatNumber, RISK_BADGE_CLASS, CHART_COLORS } from "@/lib/utils";

const CustomTooltipRevenue = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card" style={{ padding: "10px 14px", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-green)" }}>
        {formatCurrency(payload[0].value)}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ["kpis"],
    queryFn: getKPIs,
    refetchInterval: 30000,
  });
  const { data: trend = [], isLoading: trendLoading } = useQuery({
    queryKey: ["salesTrend"],
    queryFn: () => getSalesTrend(30),
  });
  const { data: catRevenue = [] } = useQuery({
    queryKey: ["categoryRevenue"],
    queryFn: getCategoryRevenue,
  });
  const { data: urgentReorders = [] } = useQuery({
    queryKey: ["urgentReorders"],
    queryFn: getUrgentReorders,
  });

  if (kpiLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <LoadingSpinner message="Loading dashboard data..." />
      </div>
    );
  }

  // Handle empty state (No data uploaded yet)
  if (kpis?.total_products === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="depth-card max-w-lg w-full p-10 flex flex-col items-center text-center">
          <Mascot emotion="thinking" />
          <h2 className="text-2xl font-bold mt-6 mb-2">Your Inventory is Empty</h2>
          <p className="text-text-secondary mb-8 text-sm">
            Welcome to StockWise AI! It looks like you haven't uploaded any inventory data yet. Please upload your CSV file to get started.
          </p>
          <Link href="/upload" className="bg-accent text-white py-3 px-8 rounded-lg font-semibold hover:bg-accent-hover hover:-translate-y-0.5 transition-all shadow-lg shadow-accent/20 flex items-center gap-2">
            <ShoppingCart size={18} />
            Upload Inventory CSV
          </Link>
        </div>
      </div>
    );
  }

  const urgencyScore = kpis?.reorder_urgency_score ?? 0;
  const urgencyColor =
    urgencyScore >= 70 ? "#ef4444" : urgencyScore >= 40 ? "#f59e0b" : "#00e5a0";

  let mascotEmotion: MascotEmotion = "calm";
  let mascotMessage = "All stocks look healthy! Great job managing your inventory.";
  
  if (urgencyScore >= 70) {
    mascotEmotion = "concerned";
    mascotMessage = `Critical alert: ${kpis?.low_stock_count} items are running low. We need to reorder soon!`;
  } else if (urgencyScore >= 40) {
    mascotEmotion = "thinking";
    mascotMessage = "Some items are getting low. Might be a good time to review the reorder plan.";
  } else if (kpis?.todays_revenue > 0) {
    mascotEmotion = "excited";
    mascotMessage = `Sales are looking good today! Revenue is up to ${formatCurrency(kpis.todays_revenue)}.`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1200, margin: "0 auto" }}>
      {/* Mascot Section */}
      <div style={{ marginBottom: 8 }}>
        <Mascot emotion={mascotEmotion} message={mascotMessage} />
      </div>
      {/* KPI Cards */}
      <section aria-label="Key performance indicators" className="flex flex-row flex-wrap gap-4">
        <div className="flex-1 min-w-[160px] md:min-w-[200px]">
          <KpiCard
            title="Total SKUs"
            value={formatNumber(kpis?.total_skus ?? 0, 0)}
            subtitle="Products in inventory"
            icon={<Package size={15} />}
            color="#3b9eff"
          />
        </div>
        <div className="flex-1 min-w-[160px] md:min-w-[200px]">
          <KpiCard
            title="Low Stock Items"
            value={String(kpis?.low_stock_count ?? 0)}
            subtitle={`${kpis?.out_of_stock_count ?? 0} out of stock`}
            icon={<AlertTriangle size={15} />}
            color="#f59e0b"
            glowColor={kpis?.low_stock_count > 3 ? "#f59e0b" : undefined}
          />
        </div>
        <div className="flex-1 min-w-[160px] md:min-w-[200px]">
          <KpiCard
            title="Today's Revenue"
            value={formatCurrency(kpis?.todays_revenue ?? 0)}
            subtitle={`${formatNumber(kpis?.monthly_revenue ?? 0, 0)} this month`}
            icon={<DollarSign size={15} />}
            color="#00e5a0"
            trend={{ value: `${kpis?.avg_margin_pct?.toFixed(1)}% avg margin`, positive: true }}
          />
        </div>
        <div className="flex-1 min-w-[160px] md:min-w-[200px]">
          <KpiCard
            title="Reorder Urgency"
            value={`${urgencyScore}%`}
            subtitle="Of SKUs need restocking"
            icon={<ShoppingCart size={15} />}
            color={urgencyColor}
            glowColor={urgencyScore > 50 ? urgencyColor : undefined}
          />
        </div>
      </section>

      {/* Second row: inventory value + alert */}
      <div className="flex flex-row flex-wrap gap-4 mt-4">
        <div className="flex-1 min-w-[100%] lg:min-w-[300px]">
          <KpiCard
            title="Inventory Value"
            value={formatCurrency(kpis?.inventory_value ?? 0)}
            subtitle="Current stock at cost price"
            icon={<Store size={15} />}
            color="#a855f7"
          />
        </div>
        {/* Stock Health Score */}
        <div className="flex-[2] min-w-[100%] lg:min-w-[500px]">
          <div className="glass-card" style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  Stock Health Score
                </h2>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Based on inventory urgency</p>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: (100 - urgencyScore) >= 70 ? "#00e5a0" : (100 - urgencyScore) >= 40 ? "#f59e0b" : "#ef4444", fontFamily: "sans-serif" }}>
                {100 - urgencyScore}/100
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <div style={{ width: "100%", height: 8, background: "var(--bg-elevated)", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${100 - urgencyScore}%`,
                    background: (100 - urgencyScore) >= 70 ? "#00e5a0" : (100 - urgencyScore) >= 40 ? "#f59e0b" : "#ef4444",
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 11 }}>
              <div style={{ color: "var(--text-muted)" }}>
                {kpis?.low_stock_count ?? 0} items below reorder point
              </div>
              <Link
                href="/reorder"
                className="btn-primary"
                style={{ fontSize: 12, padding: "4px 10px" }}
              >
                View Plan <ArrowRight size={10} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="flex flex-row flex-wrap gap-4 mt-4 mb-4">
        {/* Sales Trend */}
        <div className="flex-[2] min-w-[100%] lg:min-w-[500px] glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Sales Trend</h2>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Last 30 days daily revenue</p>
            </div>
          </div>
          {trendLoading ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LoadingSpinner size={24} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5a0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e5a0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  interval={6}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltipRevenue />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#00e5a0"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Revenue Pie */}
        <div className="flex-1 min-w-[100%] lg:min-w-[300px] glass-card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Revenue by Category
          </h2>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>Last 30 days</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={catRevenue.slice(0, 6)}
                dataKey="revenue"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={72}
                paddingAngle={2}
              >
                {catRevenue.slice(0, 6).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {catRevenue.slice(0, 4).map((cat: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--text-secondary)" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.category}</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(cat.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgent Reorders Table */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              🚨 Urgent Reorder Queue
            </h2>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Products requiring immediate attention</p>
          </div>
          <Link href="/reorder" className="btn-secondary" style={{ fontSize: 12, padding: "7px 14px" }}>
            View All <ArrowRight size={12} />
          </Link>
        </div>

        {urgentReorders.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            ✅ No urgent reorders right now — great job!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" aria-label="Urgent reorder recommendations">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Current Stock</th>
                  <th scope="col">Reorder Point</th>
                  <th scope="col">Days to Stockout</th>
                  <th scope="col">Urgency</th>
                  <th scope="col">Recommended Qty</th>
                  <th scope="col">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {urgentReorders.slice(0, 5).map((rec: any) => (
                  <tr key={rec.product_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{rec.product_name}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{rec.product_id} · {rec.category}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: rec.current_stock === 0 ? "var(--accent-red)" : "var(--accent-amber)" }}>
                      {rec.current_stock}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{rec.reorder_point}</td>
                    <td style={{ fontWeight: 600, color: rec.estimated_days_to_stockout <= 2 ? "var(--accent-red)" : "var(--accent-amber)" }}>
                      {rec.estimated_days_to_stockout != null ? `${rec.estimated_days_to_stockout}d` : "—"}
                    </td>
                    <td>
                      <span className={RISK_BADGE_CLASS[rec.urgency] ?? "badge"}>
                        {rec.urgency}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{rec.recommended_qty}</td>
                    <td style={{ fontWeight: 600, color: "var(--accent-green)" }}>{formatCurrency(rec.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GPU Benchmark CTA */}
      <Link
        href="/benchmark"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 20px",
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(168, 85, 247, 0.08))",
          border: "1px solid rgba(245, 158, 11, 0.2)",
          borderRadius: 12,
          textDecoration: "none",
          transition: "all 0.2s",
        }}
        aria-label="View GPU acceleration benchmark"
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "rgba(245, 158, 11, 0.15)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Zap size={20} color="var(--accent-amber)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            ⚡ See the GPU Acceleration Benchmark
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Compare pandas vs cuDF on 500k rows — live timing with speedup multiplier
          </div>
        </div>
        <ArrowRight size={16} color="var(--accent-amber)" />
      </Link>
    </div>
  );
}
