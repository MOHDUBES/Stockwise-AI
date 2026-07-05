"use client";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: { value: string; positive: boolean } | null;
  glowColor?: string;
}

export function KpiCard({ title, value, subtitle, icon, color = "#00e5a0", trend, glowColor }: KpiCardProps) {
  return (
    <div
      className="glass-card"
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "default",
        boxShadow: glowColor ? `0 0 24px ${glowColor}22` : undefined,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title}
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: `${color}15`,
            border: `1px solid ${color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
          }}
        >
          {icon}
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "var(--text-primary)",
            fontFamily: "Space Grotesk, sans-serif",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{subtitle}</div>
        )}
      </div>
      {trend && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            color: trend.positive ? "var(--accent-green)" : "var(--accent-red)",
          }}
        >
          {trend.positive ? "▲" : "▼"} {trend.value}
        </div>
      )}
    </div>
  );
}
