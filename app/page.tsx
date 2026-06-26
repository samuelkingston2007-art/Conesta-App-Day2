"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface UserInfo {
  email: string;
}

export default function Home() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Auth verification failed", err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Background Orbs */}
      <div className="glow-orb-1"></div>
      <div className="glow-orb-2"></div>

      {/* Navigation Header */}
      <header style={{
        display: "flex",
        justifyContent: "between",
        alignItems: "center",
        padding: "1.5rem 2rem",
        borderBottom: "1px solid var(--border-color)",
        background: "rgba(7, 7, 10, 0.7)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          <Link href="/" style={{ textDecoration: "none", fontSize: "1.5rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🎁</span> AI Gift Finder
          </Link>
          
          <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {loading ? (
              <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading...</span>
            ) : user ? (
              <>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginRight: "0.5rem" }}>
                  Hello, <strong style={{ color: "#fff" }}>{user.email.split("@")[0]}</strong>
                </span>
                <Link href="/gifts" className="btn btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}>
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}>
                  Sign In
                </Link>
                <Link href="/signup" className="btn btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 2rem" }}>
        <div style={{ maxWidth: "800px", width: "100%", textAlign: "center", marginTop: "3rem" }} className="animate-slide-up">
          <div style={{
            display: "inline-block",
            padding: "0.35rem 1rem",
            background: "rgba(124, 58, 237, 0.1)",
            border: "1px solid rgba(124, 58, 237, 0.2)",
            borderRadius: "9999px",
            color: "#a78bfa",
            fontSize: "0.85rem",
            fontWeight: 600,
            marginBottom: "1.5rem"
          }}>
            ✨ Powered by Llama-3.3 on Groq Cloud API
          </div>

          <h1 style={{ fontSize: "3.5rem", lineHeight: "1.15", marginBottom: "1.5rem" }}>
            The smartest way to find <span style={{
              background: "var(--accent-gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>thoughtful gifts</span>.
          </h1>

          <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem", lineHeight: "1.6", marginBottom: "2.5rem" }}>
            Never struggle with gift shopping again. Describe your recipient's interests, set budgets, generate items with AI, and track lists inside your personal account dashboard.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <Link href={user ? "/gifts" : "/signup"} className="btn btn-primary" style={{ padding: "0.9rem 2.2rem", fontSize: "1.05rem" }}>
              Get Started Now
            </Link>
            <Link href="#features" className="btn btn-secondary" style={{ padding: "0.9rem 2.2rem", fontSize: "1.05rem" }}>
              Learn More
            </Link>
          </div>
        </div>

        {/* Product Preview Card */}
        <div style={{ maxWidth: "1000px", width: "100%", marginTop: "5rem" }} className="animate-fade-in">
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }}></div>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }}></div>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }}></div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginLeft: "0.5rem" }}>ai_gift_finder_dashboard.tsx</div>
            </div>
            
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "2rem", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{ color: "#fff", marginBottom: "1rem" }}>🎁 Gift Recommendation Suggestion</h3>
              <p style={{ color: "var(--text-secondary)", fontStyle: "italic", borderLeft: "3px solid var(--accent-primary)", paddingLeft: "1rem" }}>
                "Suggest a mechanical keyboard under $150 for a programmer who loves retro themes."
              </p>
              <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(124, 58, 237, 0.05)", borderRadius: "8px", border: "1px solid rgba(124, 58, 237, 0.15)" }}>
                <strong style={{ color: "#a78bfa" }}>AI Recommendation:</strong>
                <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginTop: "0.5rem" }}>
                  Consider the **Epomaker RT100** Retro Keyboard. It features a gorgeous vintage grey theme, tactile yellow switches (great for programming), hot-swappable keys, and a customizable smart mini display. Around $105, it fits comfortably under budget.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" style={{ maxWidth: "1200px", width: "100%", marginTop: "8rem", paddingBottom: "6rem" }}>
          <h2 style={{ textAlign: "center", fontSize: "2.25rem", marginBottom: "3rem" }}>Why Choose AI Gift Finder?</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            <div className="glass-card" style={{ padding: "2rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🧠</div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>AI Recommendation</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                Harness advanced LLM structures to generate highly tailored, creative recommendations that fit specific budgets and hobbies.
              </p>
            </div>

            <div className="glass-card" style={{ padding: "2rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💾</div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>Full CRUD Planner</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                Save, view, edit, and delete gifts from your private board. Organize items by recipient, budget, status, and occasion.
              </p>
            </div>

            <div className="glass-card" style={{ padding: "2rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔒</div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>Secure Session Management</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                State-of-the-art authentication using hashed passwords (bcryptjs) and HTTP-Only tokenized sessions (jsonwebtoken) to secure your data.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-color)", padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        © {new Date().getFullYear()} Conesta AI Gift Finder. All rights reserved.
      </footer>
    </div>
  );
}
