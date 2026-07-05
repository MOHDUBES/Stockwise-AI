"use client";

import Link from "next/link";
import { ArrowRight, Clock, TrendingUp, AlertTriangle, Zap, Store, CheckCircle2 } from "lucide-react";

const problems = [
  { icon: "📓", text: "Manual register / Excel — no real-time view" },
  { icon: "⏰", text: "Hours spent deciding what & how much to reorder" },
  { icon: "📉", text: "Stockouts lose sales; overstock wastes cash" },
  { icon: "❓", text: '"What should I order today?" — guesswork daily' },
];

const solutions = [
  { icon: TrendingUp, color: "#00e5a0", title: "Live Dashboard", desc: "Real-time stock levels, revenue, and alerts in one glance" },
  { icon: AlertTriangle, color: "#f59e0b", title: "Low-Stock Alerts", desc: "Automatic alerts before you run out of fast-moving items" },
  { icon: Store, color: "#3b9eff", title: "Reorder AI", desc: "EOQ-based recommendations with urgency scores and pricing" },
  { icon: Zap, color: "#a855f7", title: "Demand Forecast", desc: "30-day predictions using ML so you never over-order" },
];

const stats = [
  { value: "4 hrs", label: "Daily time wasted on manual reorder decisions", arrow: "→", newValue: "< 30 sec", newLabel: "with StockWise AI" },
  { value: "18%", label: "Average stockout rate for manual kirana stores", arrow: "→", newValue: "< 3%", newLabel: "with AI alerts" },
  { value: "500k", label: "Rows processed per benchmark run", arrow: "→", newValue: "8× faster", newLabel: "with GPU acceleration" },
];

export default function HomePage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Hero */}
      <div
        className="fade-in-up"
        style={{
          textAlign: "center",
          padding: "40px 24px 32px",
          position: "relative",
        }}
      >
        {/* User badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            background: "rgba(0, 229, 160, 0.08)",
            border: "1px solid rgba(0, 229, 160, 0.2)",
            borderRadius: 100,
            fontSize: 12,
            color: "var(--accent-green)",
            fontWeight: 600,
            marginBottom: 24,
            letterSpacing: "0.03em",
          }}
        >
          <Store size={13} />
          Built for Kirana Stores & Local Retail Shops
        </div>

        <h1
          style={{
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 16,
            fontFamily: "Space Grotesk, sans-serif",
          }}
        >
          "What should I reorder{" "}
          <span className="gradient-text">today?</span>"
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "var(--text-secondary)",
            maxWidth: 560,
            margin: "0 auto 12px",
            lineHeight: 1.6,
          }}
        >
          Raju spends <strong style={{ color: "var(--accent-amber)" }}>4 hours every morning</strong> manually
          checking registers and calling suppliers. StockWise AI answers that question in{" "}
          <strong style={{ color: "var(--accent-green)" }}>seconds</strong>.
        </p>

        {/* Time comparison pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            marginBottom: 32,
            fontSize: 13,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent-red)" }}>
            <Clock size={14} />
            <strong>4 hours</strong> manual
          </span>
          <ArrowRight size={16} color="var(--text-muted)" />
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent-green)" }}>
            <Zap size={14} />
            <strong>&lt; 30 seconds</strong> with AI
          </span>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/dashboard" className="btn-primary" style={{ fontSize: 15, padding: "12px 28px" }}>
            Open Dashboard <ArrowRight size={16} />
          </Link>
          <Link href="/benchmark" className="btn-secondary" style={{ fontSize: 15, padding: "12px 28px" }}>
            <Zap size={16} color="var(--accent-amber)" />
            See GPU Benchmark
          </Link>
        </div>
      </div>

      {/* Problem → Solution */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 32,
        }}
      >
        {/* Problem */}
        <div
          className="glass-card"
          style={{ padding: 24 }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-red)", letterSpacing: "0.06em", marginBottom: 16, textTransform: "uppercase" }}>
            😤 Before StockWise AI
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {problems.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--text-secondary)" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{p.icon}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Solution */}
        <div
          className="glass-card glow-green"
          style={{ padding: 24 }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-green)", letterSpacing: "0.06em", marginBottom: 16, textTransform: "uppercase" }}>
            ✅ After StockWise AI
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {solutions.map(({ icon: Icon, color, title, desc }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: `${color}18`,
                    border: `1px solid ${color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={13} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div
            key={i}
            className="glass-card"
            style={{ padding: 20, textAlign: "center" }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent-red)", fontFamily: "Space Grotesk, sans-serif" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{s.arrow}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-green)", fontFamily: "Space Grotesk, sans-serif" }}>
              {s.newValue}
            </div>
            <div style={{ fontSize: 10, color: "var(--accent-green)" }}>{s.newLabel}</div>
          </div>
        ))}
      </div>

      {/* Pipeline diagram */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 16, textTransform: "uppercase" }}>
          Full Data Pipeline
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
          {[
            { step: "1", label: "Ingest", desc: "CSV upload or manual entry", color: "#3b9eff" },
            { step: "2", label: "Clean", desc: "Validate, normalize, dedupe", color: "#a855f7" },
            { step: "3", label: "Analyze", desc: "pandas + cuDF pipeline", color: "#f59e0b" },
            { step: "4", label: "Model", desc: "Forecast + risk scoring", color: "#00e5a0" },
            { step: "5", label: "Visualize", desc: "Dashboard + alerts", color: "#00e5a0" },
          ].map(({ step, label, desc, color }, i, arr) => (
            <div key={step} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ flex: 1, textAlign: "center", minWidth: 80 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: `${color}18`,
                    border: `2px solid ${color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 6px",
                    fontSize: 13,
                    fontWeight: 700,
                    color,
                  }}
                >
                  {step}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight size={16} color="var(--border)" style={{ flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", paddingBottom: 32 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          🔒 All data stays local. No cloud required for demo mode.
        </p>
        <Link href="/dashboard" className="btn-primary" style={{ fontSize: 14, padding: "11px 24px" }}>
          Start Making Better Decisions <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
