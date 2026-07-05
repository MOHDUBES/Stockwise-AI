"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mascot, MascotEmotion } from "@/components/ui/Mascot";
import { askAssistant, confirmAssistantAction } from "@/lib/api";
import { Send, Clock, Sparkles, MessageSquare, AlertCircle, RefreshCw, Box, TrendingUp, Check, X } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  intent?: any;
  data?: any;
  processingTime?: number;
  error?: boolean;
  requiresConfirmation?: boolean;
  originalQuery?: string;
}

const QUICK_ACTIONS = [
  { text: "What needs reordering today?", icon: RefreshCw },
  { text: "Show low stock alerts", icon: AlertCircle },
  { text: "Add 50 units of Parle-G", icon: Box },
  { text: "Show this week's sales trend", icon: TrendingUp },
];

export default function AskAIPage() {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [mascotState, setMascotState] = useState<{ emotion: MascotEmotion; message: string }>({
    emotion: "calm",
    message: "Hi! I'm StockWise AI. Ask me anything about your inventory, sales, or reorder needs.",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleSubmit = async (textToSubmit: string = query) => {
    if (!textToSubmit.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: textToSubmit,
    };

    setHistory((prev) => [...prev, userMessage]);
    setQuery("");
    setIsProcessing(true);
    setMascotState({
      emotion: "thinking",
      message: "Processing your request...",
    });

    try {
      const result = await askAssistant(textToSubmit);
      const isAwaiting = result.status === "awaiting_confirmation";

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: result.response,
        intent: result.intent,
        data: result.data,
        processingTime: result.processing_time_ms,
        error: result.intent?.action === "unknown" || result.data?.status === "error",
        requiresConfirmation: isAwaiting,
        originalQuery: textToSubmit,
      };

      setHistory((prev) => [...prev, aiMessage]);

      setMascotState({
        emotion: aiMessage.error ? "concerned" : isAwaiting ? "thinking" : "excited",
        message: aiMessage.error
          ? "Hmm, something went wrong. Try rephrasing?"
          : isAwaiting
            ? "Please confirm the action below."
            : "Got it! Here's what I found.",
      });
    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: "Sorry, I encountered an error connecting to the backend. Please make sure the backend is running and try again.",
        error: true,
      };
      setHistory((prev) => [...prev, errorMessage]);
      setMascotState({
        emotion: "concerned",
        message: "Oops, connection failed.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmation = async (msgId: string, intent: any, originalQuery: string, confirm: boolean) => {
    setHistory(prev => prev.map(m => m.id === msgId ? { ...m, requiresConfirmation: false } : m));

    if (!confirm) {
      setHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: "ai",
        text: "Action cancelled.",
        error: false
      }]);
      setMascotState({ emotion: "calm", message: "No problem — action cancelled." });
      return;
    }

    setIsProcessing(true);
    setMascotState({ emotion: "thinking", message: "Executing action..." });

    try {
      const result = await confirmAssistantAction(originalQuery, intent);
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "ai",
        text: result.response,
        intent: result.intent,
        data: result.data,
        processingTime: result.processing_time_ms,
        error: result.data?.status === "error",
      };
      setHistory(prev => [...prev, aiMessage]);
      setMascotState({
        emotion: aiMessage.error ? "concerned" : "excited",
        message: aiMessage.error ? "Something went wrong." : "Done! Stock updated successfully.",
      });
    } catch (err: any) {
      setHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: "ai",
        text: "An error occurred while confirming the action.",
        error: true
      }]);
      setMascotState({ emotion: "concerned", message: "Execution failed." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1200, margin: '0 auto' }}>
      {/* Mascot Section */}
      <div style={{ marginBottom: 8 }}>
        <Mascot emotion={mascotState.emotion} message={mascotState.message} />
      </div>

      {/* Main content: Chat + Quick Actions side by side */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* Chat Panel */}
        <div className="depth-card flex-1 w-full" style={{
          display: "flex",
          flexDirection: "column",
          minHeight: 500,
          maxHeight: 700,
          overflow: "hidden",
        }}>
          {/* Chat header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}>
            <Sparkles size={16} color="var(--accent-purple)" />
            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
              Conversation
            </span>
            {isProcessing && (
              <span style={{
                marginLeft: "auto",
                fontSize: 11,
                color: "var(--accent-purple)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}>
                <span style={{ animation: "pulse 1.5s infinite" }}>●</span> Processing...
              </span>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {history.length === 0 ? (
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                textAlign: "center",
                gap: 12,
              }}>
                <MessageSquare size={40} strokeWidth={1} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--text-secondary)" }}>
                    No messages yet
                  </div>
                  <div style={{ fontSize: 12 }}>
                    Try a quick action on the right, or type your question below.
                  </div>
                </div>
              </div>
            ) : (
              history.map((msg) => (
                <div key={msg.id} style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}>
                  <div style={{
                    maxWidth: "80%",
                    borderRadius: 14,
                    padding: "12px 16px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, var(--accent-purple), #7c3aed)"
                      : msg.error
                        ? "rgba(239, 68, 68, 0.08)"
                        : "var(--bg-card)",
                    border: msg.role === "user"
                      ? "none"
                      : msg.error
                        ? "1px solid rgba(239, 68, 68, 0.3)"
                        : "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}>
                    <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 13 }}>{msg.text}</p>

                    {/* Metadata */}
                    {msg.role === "ai" && (
                      <div style={{
                        marginTop: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 11,
                        color: "var(--text-muted)",
                        paddingTop: 10,
                        borderTop: "1px solid var(--border-muted)",
                      }}>
                        {msg.processingTime && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={11} /> {msg.processingTime}ms
                          </span>
                        )}
                        {msg.intent && msg.intent.action !== "unknown" && (
                          <span style={{
                            background: "rgba(168, 85, 247, 0.1)",
                            border: "1px solid rgba(168, 85, 247, 0.2)",
                            color: "var(--accent-purple)",
                            padding: "1px 8px",
                            borderRadius: 100,
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}>
                            {msg.intent.action.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Confirmation Buttons */}
                    {msg.requiresConfirmation && msg.intent && msg.originalQuery && (
                      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                        <button
                          id={`confirm-yes-${msg.id}`}
                          onClick={() => handleConfirmation(msg.id, msg.intent, msg.originalQuery!, true)}
                          disabled={isProcessing}
                          className="btn-primary"
                          style={{ fontSize: 12, padding: "7px 14px" }}
                        >
                          <Check size={14} /> Confirm
                        </button>
                        <button
                          id={`confirm-no-${msg.id}`}
                          onClick={() => handleConfirmation(msg.id, msg.intent, msg.originalQuery!, false)}
                          disabled={isProcessing}
                          className="btn-secondary"
                          style={{ fontSize: 12, padding: "7px 14px" }}
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "14px 16px",
            borderTop: "1px solid var(--border)",
            background: "rgba(0,0,0,0.15)",
            flexShrink: 0,
          }}>
            <div style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "8px 8px 8px 14px",
              transition: "border-color 0.2s",
            }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-purple)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <textarea
                id="ask-ai-input"
                className="input"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  padding: "4px 0",
                  minHeight: 36,
                  maxHeight: 120,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
                placeholder="Ask anything about inventory, sales, or reordering..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isProcessing}
              />
              <button
                id="ask-ai-send"
                onClick={() => handleSubmit()}
                disabled={!query.trim() || isProcessing}
                style={{
                  width: 38,
                  height: 38,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, var(--accent-purple), #7c3aed)",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "white",
                  transition: "all 0.2s",
                  opacity: !query.trim() || isProcessing ? 0.5 : 1,
                }}
                title="Send (Enter)"
              >
                <Send size={16} style={{ transform: isProcessing ? "scale(0.9)" : "scale(1)", transition: "transform 0.2s" }} />
              </button>
            </div>
            <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6, paddingLeft: 2 }}>
              Press <kbd style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 3, padding: "0 4px", fontSize: 10 }}>Enter</kbd> to send · <kbd style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 3, padding: "0 4px", fontSize: 10 }}>Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="w-full lg:w-[260px] flex-shrink-0 flex flex-col gap-[14px]">
          <div className="depth-card" style={{ padding: "18px 16px" }}>
            <h3 style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              marginBottom: 14,
            }}>
              Quick Actions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  id={`quick-action-${idx}`}
                  onClick={() => handleSubmit(action.text)}
                  disabled={isProcessing}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border-muted)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 12,
                    transition: "all 0.15s",
                    opacity: isProcessing ? 0.5 : 1,
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessing) {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(168, 85, 247, 0.08)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(168, 85, 247, 0.3)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-muted)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "rgba(168, 85, 247, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "var(--accent-purple)",
                  }}>
                    <action.icon size={14} />
                  </div>
                  <span style={{ lineHeight: 1.4 }}>{action.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tips card */}
          <div className="depth-card" style={{ padding: "14px 16px" }}>
            <h3 style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              marginBottom: 10,
            }}>
              Try Asking
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "\"How many units of Amul Butter left?\"",
                "\"Add 100 units of Tata Salt\"",
                "\"Sales trend this week\"",
              ].map((tip, i) => (
                <p key={i} style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, fontStyle: "italic" }}>
                  {tip}
                </p>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <button
              id="clear-history-btn"
              onClick={() => {
                setHistory([]);
                setMascotState({ emotion: "calm", message: "Hi! I'm StockWise AI. Ask me anything about your inventory." });
              }}
              style={{
                background: "transparent",
                border: "1px solid var(--border-muted)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 12,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-red)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-red)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-muted)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
              }}
            >
              Clear Conversation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
