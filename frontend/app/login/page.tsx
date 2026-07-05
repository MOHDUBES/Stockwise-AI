"use client";

import React, { useState } from "react";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { request } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { Mascot } from "@/components/ui/Mascot";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await request("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      
      // Automatically triggers checkAuth via the provider, but we can fast-track it:
      login({ username, name: "Raju (Demo User)" });
    } catch (err: any) {
      setError(err.message || "Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      const res: any = await request("/api/v1/auth/google", {
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
        <Mascot emotion={error ? "concerned" : "excited"} message={error || "Welcome to StockWise AI! Please login."} />
      </div>

      <div className="glass-card" style={{ padding: 40, width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Login</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sign in to manage your inventory.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Username</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="demo"
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
          <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                  PASSWORD
                </label>
                <Link href="/forgot-password" style={{ fontSize: 11, color: "var(--accent-blue)", textDecoration: "none", fontWeight: 500 }}>
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
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
            {isLoading ? "Signing in..." : <><LogIn size={16} /> Sign In</>}
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
            Don't have an account?{" "}
            <Link href="/register" style={{ color: "var(--accent-blue)", fontWeight: 600, textDecoration: "none" }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
