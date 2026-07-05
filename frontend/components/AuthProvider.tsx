"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { request } from "@/lib/api";

interface User {
  username: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const userData = await request<User>("/api/v1/auth/me");
        setUser(userData);
        if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
          router.push("/dashboard");
        }
      } catch (err) {
        setUser(null);
        if (pathname !== "/login" && pathname !== "/register" && pathname !== "/forgot-password") {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [pathname, router]);

  const login = (newUser: User) => {
    setUser(newUser);
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      await request("/api/v1/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    }
    setUser(null);
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "var(--bg-default)", color: "var(--text-primary)" }}>
        Loading StockWise AI...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
