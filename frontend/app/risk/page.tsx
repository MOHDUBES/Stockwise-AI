"use client";

import { useQuery } from "@tanstack/react-query";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { AlertTriangle } from "lucide-react";
import { getRiskScores } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { RISK_COLORS, RISK_BADGE_CLASS, formatNumber } from "@/lib/utils";

function RiskGauge({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ position: "relative", width: 64, height: 64 }}>
      <svg viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="32" cy="32" r="26"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${(score / 100) * 163.4} 163.4`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: 13, fontWeight: 800, color,
        fontFamily: "Space Grotesk, sans-serif",
      }}>
        {score}
      </div>
    </div>
  );
}

export default function RiskPage() {
  const { data: scores = [], isLoading } = useQuery({
    queryKey: ["riskScores"],
    queryFn: getRiskScores,
  });

  if (isLoading) return <LoadingSpinner message="Computing risk scores..." />;

  const critical = scores.filter((s: any) => s.risk_level === "critical");
  const topScore = scores[0];

  const radarData = topScore ? [
    { subject: "Velocity", value: topScore.velocity_risk },
    { subject: "Stockout", value: topScore.stockout_risk },
    { subject: "Spoilage", value: topScore.spoilage_risk },
    { subject: "Price", value: topScore.price_risk },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1200, margin: '0 auto' }}>
      {/* Alert banner */}
      {critical.length > 0 && (
        <div
          className="glass-card"
          style={{
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "rgba(239, 68, 68, 0.06)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
          }}
          role="alert"
        >
          <AlertTriangle size={20} color="var(--accent-red)" className="pulse" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              {critical.length} Critical Risk {critical.length === 1 ? "Product" : "Products"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {critical.map((c: any) => c.product_name).join(", ")}
            </div>
          </div>
        </div>
      )}

      {/* Top charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Radar chart for worst product */}
        {topScore && (
          <div className="glass-card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              Risk Breakdown — {topScore.product_name}
            </h2>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
              Multi-dimensional risk analysis (highest risk product)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <Radar
                  name="Risk Score"
                  dataKey="value"
                  stroke={RISK_COLORS[topScore.risk_level]}
                  fill={RISK_COLORS[topScore.risk_level]}
                  fillOpacity={0.2}
                />
                <Tooltip formatter={(v: any) => [`${v}/100`, "Risk Score"]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Risk distribution */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Risk Distribution</h2>
          {["critical", "high", "medium", "low"].map((level) => {
            const count = scores.filter((s: any) => s.risk_level === level).length;
            const pct = scores.length ? (count / scores.length) * 100 : 0;
            return (
              <div key={level} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span className={RISK_BADGE_CLASS[level]}>{level}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{count} products ({pct.toFixed(0)}%)</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${pct}%`, background: RISK_COLORS[level] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk scores table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700 }}>Product Risk Scores</h2>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Weighted: Stockout 40% · Spoilage 20% · Velocity 25% · Price 15%
          </p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" aria-label="Product risk scores">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Overall Score</th>
                <th scope="col">Risk Level</th>
                <th scope="col">Velocity Risk</th>
                <th scope="col">Stockout Risk</th>
                <th scope="col">Spoilage Risk</th>
                <th scope="col">Price Risk</th>
                <th scope="col">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s: any) => {
                const color = RISK_COLORS[s.risk_level];
                return (
                  <tr key={s.product_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{s.product_name}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.category}</div>
                    </td>
                    <td>
                      <RiskGauge score={Math.round(s.overall_score)} color={color} />
                    </td>
                    <td>
                      <span className={RISK_BADGE_CLASS[s.risk_level] ?? "badge"}>
                        {s.risk_level}
                      </span>
                    </td>
                    {["velocity_risk", "stockout_risk", "spoilage_risk", "price_risk"].map((key) => (
                      <td key={key}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${s[key]}%`,
                                background: s[key] >= 70 ? "#ef4444" : s[key] >= 40 ? "#f59e0b" : "#00e5a0",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{s[key]}</span>
                        </div>
                      </td>
                    ))}
                    <td style={{ fontSize: 11, color: "var(--text-secondary)", maxWidth: 200 }}>
                      {s.recommendation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
