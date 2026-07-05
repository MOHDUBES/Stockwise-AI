"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getAllForecasts, getProductForecast } from "@/lib/api";
import { getProducts } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "increasing") return <TrendingUp size={14} color="var(--accent-green)" />;
  if (trend === "decreasing") return <TrendingDown size={14} color="var(--accent-red)" />;
  return <Minus size={14} color="var(--text-muted)" />;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card" style={{ padding: "10px 14px" }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ fontSize: 12, color: p.color, fontWeight: 600 }}>
          {p.name}: {Number(p.value).toFixed(1)} units
        </div>
      ))}
    </div>
  );
};

export default function ForecastPage() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const { data: products } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => getProducts("page_size=50"),
  });

  const { data: forecasts = [], isLoading } = useQuery({
    queryKey: ["forecasts"],
    queryFn: () => getAllForecasts(6),
  });

  const { data: selectedForecast, isLoading: selectedLoading } = useQuery({
    queryKey: ["forecast", selectedProduct],
    queryFn: () => getProductForecast(selectedProduct!),
    enabled: !!selectedProduct,
  });

  const displayForecast = selectedForecast ?? forecasts[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1200, margin: '0 auto' }}>
      {/* Product selector */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>30-Day Demand Forecast</h2>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Holt-Winters exponential smoothing with 95% confidence intervals
            </p>
          </div>
          <select
            className="input"
            style={{ width: 240 }}
            value={selectedProduct ?? ""}
            onChange={(e) => setSelectedProduct(e.target.value || null)}
            aria-label="Select product for forecast"
          >
            <option value="">-- Select a product --</option>
            {products?.items?.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Main chart */}
        {(isLoading || selectedLoading) ? (
          <LoadingSpinner message="Generating forecast..." />
        ) : displayForecast ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                {displayForecast.product_name}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <TrendIcon trend={displayForecast.trend} />
                <span style={{
                  color: displayForecast.trend === "increasing" ? "var(--accent-green)"
                    : displayForecast.trend === "decreasing" ? "var(--accent-red)"
                    : "var(--text-muted)"
                }}>
                  {displayForecast.trend}
                </span>
              </div>
              <div className="badge badge-blue">
                Confidence: {(displayForecast.confidence * 100).toFixed(0)}%
              </div>
              {displayForecast.seasonality_detected && (
                <div className="badge badge-purple">🔄 Seasonal Pattern</div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={displayForecast.forecast} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b9eff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b9eff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b9eff" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b9eff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  tickFormatter={(d) => {
                    const dt = new Date(d);
                    return `${dt.getDate()}/${dt.getMonth() + 1}`;
                  }}
                  interval={4}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  unit=" u"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="upper_bound"
                  stroke="none"
                  fill="#3b9eff"
                  fillOpacity={0.08}
                  name="Upper CI"
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3b9eff"
                  strokeWidth={2.5}
                  fill="url(#predGrad)"
                  name="Predicted"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="lower_bound"
                  stroke="none"
                  fill="#040d14"
                  fillOpacity={1}
                  name="Lower CI"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>

      {/* Mini forecast cards for all products */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
        All Product Forecasts
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {isLoading
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />
            ))
          : forecasts.map((f: any) => (
              <div
                key={f.product_id}
                className="glass-card"
                style={{
                  padding: 16,
                  cursor: "pointer",
                  border: selectedProduct === f.product_id
                    ? "1px solid var(--accent-blue)"
                    : "1px solid var(--border)",
                  transition: "all 0.15s",
                }}
                onClick={() => setSelectedProduct(f.product_id)}
                role="button"
                tabIndex={0}
                aria-label={`View forecast for ${f.product_name}`}
                onKeyDown={(e) => e.key === "Enter" && setSelectedProduct(f.product_id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                    {f.product_name}
                  </div>
                  <TrendIcon trend={f.trend} />
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={f.forecast.slice(0, 14)}>
                    <defs>
                      <linearGradient id={`mini-${f.product_id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b9eff" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b9eff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      stroke="#3b9eff"
                      strokeWidth={1.5}
                      fill={`url(#mini-${f.product_id})`}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <span className="badge badge-blue" style={{ fontSize: 9 }}>
                    {(f.confidence * 100).toFixed(0)}% confidence
                  </span>
                  {f.seasonality_detected && (
                    <span className="badge badge-purple" style={{ fontSize: 9 }}>Seasonal</span>
                  )}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
