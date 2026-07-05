"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Zap,
  Store,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ask-ai", label: "Ask AI", icon: Sparkles, aiHighlight: true },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/reorder", label: "Reorder AI", icon: ShoppingCart },
  { href: "/forecast", label: "Forecast", icon: TrendingUp },
  { href: "/risk", label: "Risk Scores", icon: AlertTriangle },
  { href: "/benchmark", label: "GPU Benchmark", icon: Zap, gpuHighlight: true },
];

function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <aside
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex flex-row bg-[var(--bg-surface)] backdrop-blur-md bg-opacity-95 border-t border-[var(--border)] w-full"
      style={{ height: "auto", minHeight: "60px", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav className="flex-1 w-full p-2 overflow-x-auto no-scrollbar">
        <ul className="flex flex-row list-none gap-2 m-0 p-0" role="list">
          {navItems.map(({ href, label, icon: Icon, aiHighlight, gpuHighlight }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href} className="flex-none">
                <Link
                  href={href}
                  className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all min-w-[70px]"
                  style={{
                    textDecoration: "none",
                    color: isActive ? "var(--accent-green)" : "var(--text-secondary)",
                    background: isActive ? "rgba(0, 229, 160, 0.08)" : "transparent",
                    border: isActive ? "1px solid rgba(0, 229, 160, 0.15)" : "1px solid transparent",
                  }}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    color={
                      isActive
                        ? "var(--accent-green)"
                        : aiHighlight
                          ? "var(--accent-purple)"
                          : gpuHighlight
                            ? "var(--accent-amber)"
                            : "var(--text-muted)"
                    }
                  />
                  <span className="text-[10px] font-semibold leading-tight text-center">
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

function DesktopSidebar({ pathname, user }: { pathname: string, user: any }) {
  return (
    <aside
      aria-label="Application navigation"
      role="navigation"
      className="hidden md:flex"
      style={{
        width: 220,
        minHeight: "100vh",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
          aria-label="StockWise AI Home"
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--accent-green), #00a873)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Store size={18} color="#040d14" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.1 }}>
              StockWise
            </div>
            <div style={{ fontSize: 10, color: "var(--accent-green)", fontWeight: 600, letterSpacing: "0.05em" }}>
              AI ASSISTANT
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        <ul style={{ listStyle: "none" }} role="list">
          {navItems.map(({ href, label, icon: Icon, aiHighlight, gpuHighlight }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href} style={{ marginBottom: 2 }}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive
                      ? "var(--accent-green)"
                      : aiHighlight
                        ? "var(--accent-purple)"
                        : gpuHighlight
                          ? "var(--accent-amber)"
                          : "var(--text-secondary)",
                    background: isActive
                      ? "rgba(0, 229, 160, 0.08)"
                      : "transparent",
                    border: isActive
                      ? "1px solid rgba(0, 229, 160, 0.15)"
                      : "1px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.5 : 2}
                    color={
                      isActive
                        ? "var(--accent-green)"
                        : aiHighlight
                          ? "var(--accent-purple)"
                          : gpuHighlight
                            ? "var(--accent-amber)"
                            : "var(--text-muted)"
                    }
                  />
                  {label}
                  {gpuHighlight && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 100,
                        background: "rgba(245, 158, 11, 0.15)",
                        color: "var(--accent-amber)",
                        border: "1px solid rgba(245, 158, 11, 0.25)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      GPU
                    </span>
                  )}
                  {aiHighlight && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 100,
                        background: "rgba(168, 85, 247, 0.15)",
                        color: "var(--accent-purple)",
                        border: "1px solid rgba(168, 85, 247, 0.25)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      AI
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
          padding: "14px 16px",
          borderTop: "1px solid var(--border)",
          fontSize: 11,
          color: "var(--text-muted)",
        }}
      >
        <div style={{ marginBottom: 2, fontWeight: 600, color: "var(--text-secondary)" }}>
          {user ? `${user.name.split(" ")[0]}'s General Store` : "Demo Store"}
        </div>
        <div>Demo · v1.0.0</div>
      </div>
    </aside>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      <MobileBottomNav pathname={pathname} />
      <DesktopSidebar pathname={pathname} user={user} />
    </>
  );
}
