"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, AlertTriangle, CheckCircle, BrainCircuit } from "lucide-react";

export type MascotEmotion = "calm" | "concerned" | "excited" | "thinking";

interface MascotProps {
  emotion: MascotEmotion;
  message?: string;
}

export function Mascot({ emotion, message }: MascotProps) {
  const [currentEmotion, setCurrentEmotion] = useState<MascotEmotion>(emotion);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isFloating, setIsFloating] = useState(true);

  // Smooth emotion transitions
  useEffect(() => {
    setCurrentEmotion(emotion);
  }, [emotion]);

  // Random blink effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, Math.random() * 4000 + 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  const getFace = () => {
    if (isBlinking) {
      return (
        <svg viewBox="0 0 100 100" className="mascot-face">
          <path d="M 30 45 L 45 45" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M 55 45 L 70 45" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M 40 60 Q 50 65 60 60" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    }
    
    switch (currentEmotion) {
      case "concerned":
        return (
          <svg viewBox="0 0 100 100" className="mascot-face">
            <path d="M 25 35 Q 35 30 45 40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M 75 35 Q 65 30 55 40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <circle cx="35" cy="50" r="6" fill="currentColor" />
            <circle cx="65" cy="50" r="6" fill="currentColor" />
            <path d="M 40 65 Q 50 60 60 65" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case "excited":
        return (
          <svg viewBox="0 0 100 100" className="mascot-face">
            <path d="M 30 45 Q 35 35 40 45" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M 60 45 Q 65 35 70 45" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M 35 60 Q 50 75 65 60" fill="currentColor" />
          </svg>
        );
      case "thinking":
        return (
          <svg viewBox="0 0 100 100" className="mascot-face">
            <circle cx="35" cy="45" r="5" fill="currentColor" />
            <circle cx="65" cy="45" r="5" fill="currentColor" />
            <path d="M 40 65 L 60 65" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <circle cx="20" cy="30" r="3" fill="currentColor" className="think-bubble-1" />
            <circle cx="25" cy="20" r="5" fill="currentColor" className="think-bubble-2" />
          </svg>
        );
      case "calm":
      default:
        return (
          <svg viewBox="0 0 100 100" className="mascot-face">
            <circle cx="35" cy="45" r="6" fill="currentColor" />
            <circle cx="65" cy="45" r="6" fill="currentColor" />
            <path d="M 40 60 Q 50 68 60 60" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
    }
  };

  const getTheme = () => {
    switch (currentEmotion) {
      case "concerned": return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", shadow: "0 8px 32px rgba(239, 68, 68, 0.25)" };
      case "excited": return { color: "#00e5a0", bg: "rgba(0, 229, 160, 0.1)", shadow: "0 8px 32px rgba(0, 229, 160, 0.25)" };
      case "thinking": return { color: "#a855f7", bg: "rgba(168, 85, 247, 0.1)", shadow: "0 8px 32px rgba(168, 85, 247, 0.25)" };
      case "calm":
      default: return { color: "#3b9eff", bg: "rgba(59, 158, 255, 0.1)", shadow: "0 8px 32px rgba(59, 158, 255, 0.25)" };
    }
  };

  const theme = getTheme();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {/* Character body */}
      <div
        className={`mascot-container ${isFloating ? "floating" : ""} ${currentEmotion}`}
        style={{
          width: 72,
          height: 72,
          borderRadius: 30,
          background: "var(--bg-card)",
          boxShadow: `inset 0 4px 12px rgba(255,255,255,0.05), ${theme.shadow}`,
          border: `2px solid ${theme.color}40`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-primary)",
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          overflow: "hidden",
        }}
        onMouseEnter={() => setIsFloating(false)}
        onMouseLeave={() => setIsFloating(true)}
      >
        {/* Glow effect */}
        <div style={{
          position: "absolute",
          top: -10, left: -10, right: -10, bottom: -10,
          background: `radial-gradient(circle at center, ${theme.color}40 0%, transparent 70%)`,
          zIndex: 0,
        }} />
        
        <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", transition: "all 0.2s" }}>
          {getFace()}
        </div>
        
        {/* Expression Badge */}
        <div style={{
          position: "absolute",
          bottom: -4,
          right: -4,
          background: "var(--bg-surface)",
          borderRadius: "50%",
          padding: 4,
          border: "1px solid var(--border)",
          color: theme.color,
          zIndex: 2,
        }}>
          {currentEmotion === "concerned" && <AlertTriangle size={14} />}
          {currentEmotion === "excited" && <Sparkles size={14} />}
          {currentEmotion === "thinking" && <BrainCircuit size={14} />}
          {currentEmotion === "calm" && <CheckCircle size={14} />}
        </div>
      </div>

      {/* Message Box (if provided) */}
      {message && (
        <div className="mascot-message glass-card" style={{
          padding: "12px 16px",
          borderRadius: "16px 16px 16px 4px",
          borderLeft: `3px solid ${theme.color}`,
          maxWidth: 320,
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--text-secondary)",
          position: "relative",
          animation: "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: theme.shadow,
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
