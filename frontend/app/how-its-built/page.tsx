"use client";

import { Code, Cloud, Server, Database, Zap, Sparkles } from "lucide-react";

export default function HowItsBuiltPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800, margin: "0 auto", paddingBottom: 40 }}>
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif", marginBottom: 8 }}>
          How It's Built
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
          A breakdown of the technology stack powering StockWise AI.
        </p>
      </div>

      {/* Google Cloud Section */}
      <div className="glass-card" style={{ padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "rgba(66, 133, 244, 0.1)", color: "#4285F4", padding: 10, borderRadius: 12 }}>
            <Cloud size={24} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Google Cloud Layer</h2>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Cloud Storage */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Database size={16} color="#34A853" /> Google Cloud Storage
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Used in the Data Ingestion pipeline. When a kirana store owner uploads their existing inventory CSV (via the Inventory page), the file is securely backed up to a Google Cloud Storage bucket before being processed and cleaned by the analytics engine.
            </p>
          </div>

          {/* Gemini API */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Sparkles size={16} color="#EA4335" /> Gemini API (Generative AI)
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Used in the Reorder AI module. The system analyzes sales velocity, lead times, and current stock to determine urgent reorder quantities. This complex data is then sent to Gemini 1.5 Flash, which generates a friendly, natural-language summary ("Raju, you need to restock Parle-G immediately because demand is rising..."). This translates raw data into actionable insights for non-technical users.
            </p>
          </div>
        </div>
      </div>

      {/* NVIDIA Acceleration Section */}
      <div className="glass-card" style={{ padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "rgba(118, 185, 0, 0.1)", color: "#76B900", padding: 10, borderRadius: 12 }}>
            <Zap size={24} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>NVIDIA Acceleration Layer</h2>
        </div>
        
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Code size={16} color="#76B900" /> RAPIDS cuDF & cudf.pandas
          </h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
            Used across the entire backend data pipeline. By setting the environment variable <code>USE_REAL_CUDF=true</code>, the FastAPI backend injects <code>cudf.pandas.install()</code> at startup.
          </p>
          <ul style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>This seamlessly accelerates all standard <strong>pandas</strong> code used in the analytics, forecasting, and risk scoring modules by running it on the NVIDIA GPU.</li>
            <li>We built a dedicated <a href="/benchmark" style={{ color: "var(--accent-green)", textDecoration: "none" }}>Benchmark page</a> that proves the efficiency gains by timing operations like GroupBy Aggregations and 7-day Rolling Averages on simulated large datasets (up to 1M rows) comparing CPU pandas vs GPU cuDF.</li>
          </ul>
        </div>
      </div>

      {/* Additional Tech */}
      <div className="glass-card" style={{ padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7", padding: 10, borderRadius: 12 }}>
            <Server size={24} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Core Frameworks</h2>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Frontend</h3>
            <ul style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
              <li>Next.js 15 (App Router)</li>
              <li>React 19 & TypeScript</li>
              <li>Recharts (Data Visualization)</li>
              <li>Lucide React (Icons)</li>
              <li>Tailwind CSS & Custom UI Tokens</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Backend</h3>
            <ul style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
              <li>Python 3.10+</li>
              <li>FastAPI (Async REST API)</li>
              <li>SlowAPI (Rate Limiting)</li>
              <li>Pandas (Data Science)</li>
              <li>Pydantic (Validation)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
