"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, RefreshCw, LogOut, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";

const pageTitles: Record<string, { title: string; desc: string }> = {
  "/": { title: "Home", desc: "Welcome to StockWise AI" },
  "/dashboard": { title: "Dashboard", desc: "Live inventory & sales overview" },
  "/ask-ai": { title: "✨ Ask StockWise AI", desc: "Natural-language inventory assistant" },
  "/inventory": { title: "Inventory Manager", desc: "Manage your products and stock levels" },
  "/reorder": { title: "Reorder Recommendations", desc: "AI-powered restocking decisions" },
  "/forecast": { title: "Demand Forecast", desc: "30-day demand predictions per product" },
  "/risk": { title: "Risk Scores", desc: "Multi-dimensional product risk assessment" },
  "/benchmark": { title: "⚡ GPU Acceleration Benchmark", desc: "pandas vs cuDF performance comparison" },
  "/how-its-built": { title: "✨ How It's Built", desc: "Technology stack and architecture" },
};

export function TopBar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const page = pageTitles[pathname] ?? { title: "StockWise AI", desc: "" };
  
  const now = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      role="banner"
      style={{
        height: 60,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
        position: "relative",
        zIndex: 50,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text-primary)",
            fontFamily: "Space Grotesk, sans-serif",
            lineHeight: 1.2,
          }}
        >
          {page.title}
        </h1>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
          {page.desc}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{now}</span>

        <button
          onClick={() => queryClient.invalidateQueries()}
          aria-label="Refresh all data"
          title="Refresh data"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "transparent",
            border: "1px solid var(--border)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            transition: "all 0.15s",
          }}
        >
          <RefreshCw size={14} />
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label="Notifications"
            title="Notifications"
            aria-haspopup="menu"
            aria-expanded={isNotifOpen}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-red)",
              position: "relative",
            }}
          >
            <Bell size={14} />
            <span
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "var(--accent-red)",
                fontSize: 8,
                fontWeight: 700,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="3 alerts"
            >
              3
            </span>
          </button>
          
          {isNotifOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 8,
                width: 250,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                Alerts
              </h3>
              <div style={{ fontSize: 12, color: "var(--text-primary)" }}>
                🚨 <strong>Parle-G</strong> stock is critically low.
              </div>
              <div style={{ fontSize: 12, color: "var(--text-primary)" }}>
                🚨 <strong>Aashirvaad Atta</strong> needs reordering today.
              </div>
              <div style={{ fontSize: 12, color: "var(--text-primary)" }}>
                ⚠️ <strong>Amul Butter</strong> is running fast.
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu Dropdown */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-haspopup="menu"
            aria-expanded={isProfileOpen}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #00e5a0, #3b9eff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#040d14",
              }}
              aria-hidden="true"
            >
              {user ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {user ? user.name.split(" ")[0] : "Guest"}
            </span>
          </button>

          {isProfileOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 8,
                width: 200,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                padding: 8,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{user ? user.name : "Guest User"}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user ? user.username : ""}</div>
              </div>
              
              <button
                role="menuitem"
                onClick={() => {
                  setIsProfileOpen(false);
                  router.push("/profile");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "transparent",
                  border: "none",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13,
                }}
              >
                <User size={14} /> My Account
              </button>
              
              <button
                role="menuitem"
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "none",
                  color: "var(--accent-red)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
