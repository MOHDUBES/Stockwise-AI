"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";

  if (isAuthPage) {
    return <main style={{ minHeight: "100vh", background: "var(--bg-base)" }}>{children}</main>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }} className="flex-col md:flex-row pb-[70px] md:pb-0">
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <main
          id="main-content"
          role="main"
          aria-label="Main content"
          style={{ flex: 1, overflow: "auto", padding: 24, background: "var(--bg-base)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
