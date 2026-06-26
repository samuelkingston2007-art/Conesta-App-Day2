"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/gifts");
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch (err) {
      setError("An unexpected network error occurred.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      padding: "2rem"
    }}>
      {/* Background glow orbs */}
      <div className="glow-orb-1"></div>
      <div className="glow-orb-2"></div>

      <div className="glass-card animate-slide-up" style={{
        maxWidth: "450px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem"
      }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Welcome Back</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Sign in to access your saved gifts and AI finder
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "8px",
            color: "#f87171",
            padding: "0.75rem 1rem",
            fontSize: "0.9rem",
            lineHeight: "1.4"
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div style={{
          textAlign: "center",
          borderTop: "1px solid var(--border-color)",
          paddingTop: "1.25rem",
          fontSize: "0.9rem",
          color: "var(--text-secondary)"
        }}>
          Don't have an account?{" "}
          <Link href="/signup" style={{ color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}