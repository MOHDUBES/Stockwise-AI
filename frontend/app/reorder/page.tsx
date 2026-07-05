"use client";

import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { getReorderRecs, getReorderSummary } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Mascot, MascotEmotion } from "@/components/ui/Mascot";
import { formatCurrency, RISK_COLORS, RISK_BADGE_CLASS } from "@/lib/utils";

function UrgencyBar({ score }: { score: number }) {
  const color = score >= 75 ? "#ef4444" : score >= 50 ? "#f59e0b" : score >= 25 ? "#3b9eff" : "#00e5a0";
  return (
    <div className="progress-bar" style={{ width: 80 }}>
      <div className="progress-fill" style={{ width: `${score}%`, background: color }} />
    </div>
  );
}

export default function ReorderPage() {
  const { data: recs = [], isLoading } = useQuery({
    queryKey: ["reorderRecs"],
    queryFn: getReorderRecs,
  });

  const critical = recs.filter((r: any) => r.urgency === "critical");
  const high = recs.filter((r: any) => r.urgency === "high");
  const medium = recs.filter((r: any) => r.urgency === "medium");
  const low = recs.filter((r: any) => r.urgency === "low");

  const totalCost = recs
    .filter((r: any) => r.urgency !== "low")
    .reduce((s: number, r: any) => s + r.total_cost, 0);

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["reorderSummary"],
    queryFn: getReorderSummary,
  });

  if (isLoading) return <LoadingSpinner message="Generating reorder recommendations..." />;

  // Determine Mascot state based on recommendations
  let mascotEmotion: MascotEmotion = "calm";
  let mascotMessage = summaryData?.summary || "Your inventory is fully stocked! No reorders needed.";
  
  if (critical.length > 0) {
    mascotEmotion = "concerned";
  } else if (summaryLoading) {
    mascotEmotion = "thinking";
    mascotMessage = "Analyzing your sales velocity and lead times to calculate perfect reorder points...";
  } else if (high.length > 0) {
    mascotEmotion = "thinking";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1200, margin: '0 auto' }}>
      {/* Mascot Section */}
      <div style={{ marginBottom: 8 }}>
        <Mascot emotion={mascotEmotion} message={mascotMessage} />
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Critical", count: critical.length, color: "#ef4444", icon: AlertTriangle },
          { label: "High", count: high.length, color: "#f59e0b", icon: Clock },
          { label: "Medium", count: medium.length, color: "#3b9eff", icon: ShoppingCart },
          { label: "All Good", count: low.length, color: "#00e5a0", icon: CheckCircle },
        ].map(({ label, count, color, icon: Icon }) => (
          <div key={label} className="glass-card" style={{ padding: 16, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
              <Icon size={14} color={color} />
              <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "Space Grotesk, sans-serif" }}>{count}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>products</div>
          </div>
        ))}
      </div>

      {/* Total cost banner */}
      {(critical.length + high.length) > 0 && (
        <div
          className="glass-card"
          style={{
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(239, 68, 68, 0.06)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              🚨 Immediate Action Required
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {critical.length + high.length} products need urgent restocking
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Estimated reorder cost</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-green)", fontFamily: "Space Grotesk, sans-serif" }}>
              {formatCurrency(totalCost)}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 0", borderBottom: "1px solid var(--border)", marginBottom: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, paddingBottom: 16 }}>
            AI Reorder Recommendations
          </h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" aria-label="Reorder recommendations table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Category</th>
                <th scope="col">Stock / Reorder Pt.</th>
                <th scope="col">Days to Stockout</th>
                <th scope="col">Avg Daily Sales</th>
                <th scope="col">Urgency</th>
                <th scope="col">Urgency Score</th>
                <th scope="col">Rec. Qty</th>
                <th scope="col">Suggested Price</th>
                <th scope="col">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {recs.map((rec: any) => (
                <tr key={rec.product_id}>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{rec.product_name}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{rec.reasoning.slice(0, 60)}…</div>
                  </td>
                  <td style={{ fontSize: 11, color: "var(--text-secondary)" }}>{rec.category}</td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: rec.current_stock === 0 ? "var(--accent-red)"
                        : rec.current_stock <= rec.reorder_point ? "var(--accent-amber)"
                        : "var(--text-primary)"
                    }}>
                      {rec.current_stock}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}> / {rec.reorder_point}</span>
                  </td>
                  <td>
                    {rec.estimated_days_to_stockout != null ? (
                      <span style={{
                        fontWeight: 700,
                        color: rec.estimated_days_to_stockout <= 2 ? "var(--accent-red)"
                          : rec.estimated_days_to_stockout <= 5 ? "var(--accent-amber)"
                          : "var(--text-primary)"
                      }}>
                        {rec.estimated_days_to_stockout}d
                      </span>
                    ) : "∞"}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {rec.avg_daily_sales.toFixed(1)} units
                  </td>
                  <td>
                    <span className={RISK_BADGE_CLASS[rec.urgency] ?? "badge"}>
                      {rec.urgency}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <UrgencyBar score={rec.urgency_score} />
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{rec.urgency_score}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--accent-blue)" }}>{rec.recommended_qty}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{formatCurrency(rec.suggested_price)}</td>
                  <td style={{ fontWeight: 700, color: "var(--accent-green)" }}>{formatCurrency(rec.total_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
