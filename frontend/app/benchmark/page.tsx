"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList, Legend,
} from "recharts";
import { Zap, Play, Info, CheckCircle2, Server } from "lucide-react";
import { runBenchmark } from "@/lib/api";

const OPERATIONS_INFO = [
  { key: "GroupBy Aggregation", desc: "Group 500k sales rows by category + product. Computes sum, mean, count.", icon: "📊" },
  { key: "Rolling Average (7-day)", desc: "7-day moving average demand per product — key for trend detection.", icon: "📈" },
  { key: "DataFrame Merge (JOIN)", desc: "Join sales table with 200-product inventory lookup table.", icon: "🔗" },
  { key: "Multi-Column Sort", desc: "Sort 500k rows by category, product, date, revenue.", icon: "🔢" },
  { key: "Filter & Risk Compute", desc: "Filter by stockout risk, compute margin and describe statistics.", icon: "🧮" },
];

const DATASET_SIZES = [
  { label: "100k rows", value: 100_000 },
  { label: "250k rows", value: 250_000 },
  { label: "500k rows", value: 500_000 },
  { label: "1M rows", value: 1_000_000 },
];

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const pandas = payload.find((p: any) => p.dataKey === "pandas_time_ms");
  const cudf = payload.find((p: any) => p.dataKey === "cudf_time_ms");
  return (
    <div className="glass-card" style={{ padding: "12px 16px", minWidth: 200 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 12, color: "#f59e0b" }}>
          🐼 pandas: <strong>{pandas?.value?.toFixed(1)}ms</strong>
        </div>
        <div style={{ fontSize: 12, color: "#00e5a0" }}>
          ⚡ cuDF: <strong>{cudf?.value ? `${cudf.value.toFixed(1)}ms` : "CPU Fallback"}</strong>
        </div>
        {pandas && cudf?.value && (
          <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: "#a855f7" }}>
            {(pandas.value / cudf.value).toFixed(1)}× faster
          </div>
        )}
      </div>
    </div>
  );
};

function SpeedupBar({ speedup }: { speedup: number }) {
  const max = 15;
  const pct = Math.min((speedup / max) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="progress-bar" style={{ flex: 1, height: 10 }}>
        <div
          className="progress-fill"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #a855f7, #00e5a0)",
          }}
        />
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color: "#a855f7", fontFamily: "Space Grotesk, sans-serif", minWidth: 44 }}>
        {speedup}×
      </span>
    </div>
  );
}

export default function BenchmarkPage() {
  const [datasetSize, setDatasetSize] = useState(500_000);
  const [hasRun, setHasRun] = useState(false);

  const { mutate, data, isPending, error } = useMutation({
    mutationFn: () => runBenchmark(datasetSize),
    onSuccess: () => setHasRun(true),
  });

  const chartData = data?.results?.map((r: any) => ({
    name: r.operation.replace(" (JOIN)", "").replace(" (7-day)", ""),
    pandas_time_ms: r.pandas_time_ms,
    cudf_time_ms: r.cudf_time_ms,
    speedup: r.speedup,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero banner */}
      <div
        className="glass-card"
        style={{
          padding: "28px 32px",
          background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(0,229,160,0.08))",
          border: "1px solid rgba(168,85,247,0.2)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif", marginBottom: 8 }}>
          <span style={{ color: "#f59e0b" }}>pandas</span>
          {" vs "}
          <span className="gradient-text">cuDF GPU</span>
          {" Acceleration"}
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto 20px" }}>
          Watch real pandas operations — the same computations your kirana store data runs through — execute
          with GPU acceleration via{" "}
          <strong style={{ color: "var(--accent-green)" }}>NVIDIA RAPIDS cuDF</strong>.
          See exactly how much faster smart infrastructure makes your decisions.
        </p>

        {/* Dataset selector + Run button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {DATASET_SIZES.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setDatasetSize(value)}
                aria-pressed={datasetSize === value}
                style={{
                  padding: "7px 16px",
                  borderRadius: 8,
                  border: `1px solid ${datasetSize === value ? "var(--accent-purple)" : "var(--border)"}`,
                  background: datasetSize === value ? "rgba(168,85,247,0.12)" : "transparent",
                  color: datasetSize === value ? "#a855f7" : "var(--text-muted)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="btn-primary"
            onClick={() => mutate()}
            disabled={isPending}
            aria-label="Run benchmark"
            style={{
              fontSize: 14,
              padding: "10px 24px",
              background: isPending
                ? "rgba(0,229,160,0.3)"
                : "linear-gradient(135deg, #a855f7, #00e5a0)",
            }}
          >
            {isPending ? (
              <>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  animation: "spin 0.8s linear infinite",
                }} />
                Running benchmark...
              </>
            ) : (
              <><Play size={15} /> Run Benchmark</>
            )}
          </button>
        </div>
      </div>

      {/* Operations info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {OPERATIONS_INFO.map(({ key, desc, icon }) => (
          <div key={key} className="glass-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              {key}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.4 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Results */}
      {error && (
        <div style={{ padding: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "var(--accent-red)", fontSize: 13 }}>
          ❌ Benchmark failed: {(error as Error).message}. Make sure the backend is running.
        </div>
      )}

      {data && (
        <>
          {/* Summary mega stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Dataset Size", value: `${(data.dataset_rows / 1000).toFixed(0)}k`,
                sub: "synthetic rows", color: "#3b9eff",
              },
              {
                label: "Total pandas Time", value: `${data.total_pandas_ms.toFixed(0)}ms`,
                sub: "all 5 operations", color: "#f59e0b",
              },
              {
                label: "Total cuDF Time", value: data.total_cudf_ms > 0 ? `${data.total_cudf_ms.toFixed(0)}ms` : "N/A",
                sub: data.total_cudf_ms > 0 ? "GPU-accelerated" : "CPU Fallback Active", color: "#00e5a0",
              },
              {
                label: "Average Speedup", value: data.total_cudf_ms > 0 ? `${data.avg_speedup}×` : "1.0×",
                sub: data.total_cudf_ms > 0 ? "faster with GPU" : "GPU not available", color: "#a855f7",
              },
            ].map(({ label, value, sub, color }) => (
              <div
                key={label}
                className="glass-card"
                style={{
                  padding: 20,
                  textAlign: "center",
                  boxShadow: `0 0 24px ${color}22`,
                }}
              >
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  {label}
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>
                  {value}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Main bar chart */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              Operation Timing: pandas vs cuDF
            </h2>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 20 }}>
              Lower is better · Dataset: {(data.dataset_rows / 1000).toFixed(0)}k rows
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  unit="ms"
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend
                  iconType="rect"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
                />
                <Bar dataKey="pandas_time_ms" name="🐼 pandas (CPU)" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="pandas_time_ms" position="top" formatter={(v: number) => v ? `${v.toFixed(0)}ms` : ''}
                    style={{ fill: "var(--text-muted)", fontSize: 10 }} />
                </Bar>
                <Bar dataKey="cudf_time_ms" name="⚡ cuDF (GPU)" fill="#00e5a0" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="cudf_time_ms" position="top" formatter={(v: number | null) => v ? `${v.toFixed(0)}ms` : ''}
                    style={{ fill: "var(--text-muted)", fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Per-operation speedup */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Speedup per Operation</h2>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 20 }}>
              Higher is better · Purple bar = cuDF speedup multiplier over pandas
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {data.results.map((r: any) => (
                <div key={r.operation}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.operation}</span>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-secondary)" }}>
                      <span>🐼 {r.pandas_time_ms?.toFixed(1) ?? 'N/A'}ms</span>
                      <span style={{ color: "var(--accent-green)" }}>⚡ {r.cudf_time_ms ? `${r.cudf_time_ms.toFixed(1)}ms` : "CPU Fallback"}</span>
                    </div>
                  </div>
                  <SpeedupBar speedup={r.speedup} />
                </div>
              ))}
            </div>
          </div>

          {/* Note about simulation */}
          <div
            className="glass-card"
            style={{
              padding: 16,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              background: "rgba(59,158,255,0.06)",
              border: "1px solid rgba(59,158,255,0.15)",
            }}
          >
            <Info size={16} color="var(--accent-blue)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                About these results
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {data.note}
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a
                  href="https://developer.nvidia.com/blog/rapids-cudf-accelerates-pandas"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "var(--accent-blue)", textDecoration: "underline" }}
                >
                  NVIDIA RAPIDS Blog ↗
                </a>
                <a
                  href="https://cloud.google.com/vertex-ai/docs/training/configure-compute"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "var(--accent-blue)", textDecoration: "underline" }}
                >
                  Vertex AI GPU Setup ↗
                </a>
              </div>
            </div>
          </div>

          {/* Cloud deployment info */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Server size={16} color="var(--accent-green)" />
              <h2 style={{ fontSize: 14, fontWeight: 700 }}>Google Cloud GPU Deployment</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { service: "Cloud Run", detail: "Containerized FastAPI backend (CPU mode)", status: "🟢 Active" },
                { service: "Vertex AI (GPU)", detail: "NVIDIA A100 with cuDF for real GPU benchmarks", status: "⚙️ Deploy to enable" },
                { service: "Firestore", detail: "Real-time inventory data persistence", status: "🟢 Ready" },
              ].map(({ service, detail, status }) => (
                <div
                  key={service}
                  style={{
                    padding: 14,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{service}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{detail}</div>
                  <div style={{ fontSize: 11 }}>{status}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!hasRun && !isPending && (
        <div
          className="glass-card"
          style={{
            padding: 60,
            textAlign: "center",
            border: "2px dashed var(--border)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            Ready to benchmark
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
            Click "Run Benchmark" above to compare pandas vs cuDF on {(datasetSize / 1000).toFixed(0)}k rows
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {OPERATIONS_INFO.map(({ key, icon }) => (
              <div key={key} className="badge badge-purple" style={{ fontSize: 11 }}>
                {icon} {key}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
