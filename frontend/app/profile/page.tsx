"use client";

import { useAuth } from "@/components/AuthProvider";
import { User, Mail, Shield, Key } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", width: "100%", padding: "20px 0" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>
          My Account
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Manage your personal information and security settings.
        </p>
      </div>

      <div style={{ display: "grid", gap: 24 }}>
        {/* Profile Info Card */}
        <div className="glass-card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, borderBottom: "1px solid var(--border)", paddingBottom: 24 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #00e5a0, #3b9eff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 700,
                color: "#040d14",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>{user.name}</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>StockWise AI User</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                <User size={14} /> Full Name
              </label>
              <div style={{ padding: "12px 16px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 14 }}>
                {user.name}
              </div>
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                <Mail size={14} /> Username / Email
              </label>
              <div style={{ padding: "12px 16px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 14 }}>
                {user.username}
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="glass-card" style={{ padding: 32 }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            <Shield size={20} color="var(--accent-blue)" /> Security
          </h3>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Password</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Change your account password securely</div>
            </div>
            <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Key size={14} /> Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
