"use client";

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
}

export function LoadingSpinner({ size = 32, message }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={message || "Loading"}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 40 }}
    >
      <div
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `3px solid var(--border)`,
          borderTopColor: "var(--accent-green)",
          animation: "spin 0.8s linear infinite",
        }}
      />
      {message && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{message}</p>}
    </div>
  );
}

export function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div
      className="skeleton"
      style={{ height, borderRadius: 12 }}
      aria-hidden="true"
    />
  );
}
