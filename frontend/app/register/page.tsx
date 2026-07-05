"use client";

import React, { useState } from "react";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { request } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { Mascot } from "@/components/ui/Mascot";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await request("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password, name }),
      });
      
      // Automatically log the user in locally after a successful registration
      login({ username, name });
    } catch (err: any) {
      setError(err.message || "Failed to register. Username might be taken.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      const res = await request("/api/v1/auth/google", {
        method: "POST",
      });
      // The backend returns user info directly on success for demo purposes
      login({ username: res.user.username, name: res.user.name });
    } catch (err: any) {
      setError(err.message || "Failed to login with Google");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--bg-default)" }}>
      <div style={{ marginBottom: 32 }}>
        <Mascot emotion={error ? "concerned" : "excited"} message={error || "Welcome to StockWise AI! Let's create an account."} />
      </div>

      <div className="glass-card" style={{ padding: 40, width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Create Account</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sign up to manage your smart inventory.</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Full Name</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "var(--text-primary)",
                outline: "none"
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Username</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "var(--text-primary)",
                outline: "none"
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                required
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  paddingRight: "40px",
                  color: "var(--text-primary)",
                  outline: "none",
                  width: "100%"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
          >
            {isLoading ? "Creating..." : <><UserPlus size={16} /> Create Account</>}
          </button>
        </form>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "10px 16px",
            color: "var(--text-primary)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--border)")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-surface)")}
        >
          {isGoogleLoading ? (
            "Connecting..."
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        <div style={{ textAlign: "center", marginTop: 8 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--accent-blue)", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
