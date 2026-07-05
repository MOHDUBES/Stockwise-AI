"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, KeyRound, Lock, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "verify" | "reset" | "success">("request");
  
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to request OTP");

      setStep("verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid OTP");

      setResetToken(data.reset_token);
      setStep("reset");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, reset_token: resetToken, new_password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to reset password");

      setStep("success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-base)",
      padding: 24,
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: "absolute",
        top: "-10%",
        right: "-5%",
        width: "50vw",
        height: "50vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,229,160,0.05) 0%, rgba(4,13,20,0) 70%)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        bottom: "-10%",
        left: "-5%",
        width: "50vw",
        height: "50vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,158,255,0.05) 0%, rgba(4,13,20,0) 70%)",
        pointerEvents: "none"
      }} />

      <div className="depth-card" style={{ width: "100%", maxWidth: 440, padding: 40, position: "relative", zIndex: 10 }}>
        
        <Link href="/login" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--text-muted)",
          textDecoration: "none",
          marginBottom: 24,
          transition: "color 0.2s"
        }}>
          <ArrowLeft size={14} /> Back to login
        </Link>

        {step !== "success" && (
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
              {step === "request" ? "Forgot Password" : step === "verify" ? "Enter OTP" : "Reset Password"}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {step === "request" && "Enter your username or email and we'll send you an OTP."}
              {step === "verify" && `We've sent a 6-digit OTP to ${username}. (Check backend terminal logs for demo)`}
              {step === "reset" && "Enter your new password below to reset your account."}
            </p>
          </div>
        )}

        {error && (
          <div style={{
            padding: 12,
            marginBottom: 20,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 8,
            color: "var(--accent-red)",
            fontSize: 13
          }}>
            {error}
          </div>
        )}

        {step === "request" && (
          <form onSubmit={handleRequestOTP} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
                USERNAME OR EMAIL
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, top: 12, color: "var(--text-muted)" }} />
                <input
                  type="text"
                  className="input"
                  style={{ paddingLeft: 42 }}
                  placeholder="e.g. demo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !username}
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            >
              {isLoading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerifyOTP} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
                6-DIGIT OTP
              </label>
              <div style={{ position: "relative" }}>
                <KeyRound size={16} style={{ position: "absolute", left: 14, top: 12, color: "var(--text-muted)" }} />
                <input
                  type="text"
                  className="input"
                  style={{ paddingLeft: 42, letterSpacing: 2 }}
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || otp.length !== 6}
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
                NEW PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: 12, color: "var(--text-muted)" }} />
                <input
                  type="password"
                  className="input"
                  style={{ paddingLeft: 42 }}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
                CONFIRM NEW PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: 12, color: "var(--text-muted)" }} />
                <input
                  type="password"
                  className="input"
                  style={{ paddingLeft: 42 }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !newPassword || !confirmPassword}
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {step === "success" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ 
              width: 64, height: 64, borderRadius: "50%", 
              background: "rgba(0, 229, 160, 0.1)", color: "var(--accent-green)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px"
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Password Reset!</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>
              Your password has been changed successfully.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Return to Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
