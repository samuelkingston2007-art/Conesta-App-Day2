"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface GiftItem {
  _id: string;
  name: string;
  occasion: string;
  budget: number;
  notes?: string;
  isPurchased: boolean;
}

interface UserInfo {
  id: string;
  email: string;
}

interface AIRecommendation {
  name: string;
  reason: string;
  estimatedPrice: number;
  whereToBuy: string;
  matchPercentage: number;
  giftType: string;
}

export default function GiftsPage() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // AI Questionnaire state
  const [aiRecipient, setAiRecipient] = useState("");
  const [aiOccasion, setAiOccasion] = useState("Birthday");
  const [aiBudget, setAiBudget] = useState("");
  const [aiInterests, setAiInterests] = useState("");
  const [aiTone, setAiTone] = useState("Practical");
  
  // AI Suggestions result state
  const [aiSuggestions, setAiSuggestions] = useState<AIRecommendation[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [savedAiIndices, setSavedAiIndices] = useState<Record<number, boolean>>({});

  // CRUD state
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [crudError, setCrudError] = useState("");

  // Add Gift form state
  const [manualName, setManualName] = useState("");
  const [manualOccasion, setManualOccasion] = useState("");
  const [manualBudget, setManualBudget] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [addingGift, setAddingGift] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editOccasion, setEditOccasion] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Check auth and fetch gifts
  useEffect(() => {
    async function initPage() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login");
          return;
        }

        const authData = await authRes.json();
        if (!authData.authenticated) {
          router.push("/login");
          return;
        }

        setUser(authData.user);
        
        // Fetch gifts list
        const giftsRes = await fetch("/api/gifts");
        if (giftsRes.ok) {
          const giftsData = await giftsRes.json();
          setGifts(giftsData.gifts || []);
        } else {
          setCrudError("Failed to load gifts list");
        }
      } catch (err) {
        console.error("Initialization error:", err);
        router.push("/login");
      } finally {
        setAuthLoading(false);
        setLoadingGifts(false);
      }
    }

    initPage();
  }, [router]);

  // Handle logout
  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  // Ask AI suggestion with structured format
  async function handleAskAI() {
    if (!aiRecipient.trim() || !aiOccasion.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiSuggestions([]);
    setSavedAiIndices({});

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: aiRecipient,
          occasion: aiOccasion,
          budget: aiBudget ? Number(aiBudget) : undefined,
          interests: aiInterests,
          tone: aiTone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.recommendations) {
        setAiSuggestions(data.recommendations);
      } else {
        setAiError(data.error || "Failed to generate recommendations. Please try again.");
      }
    } catch (err) {
      setAiError("Network error. Could not contact AI gift concierge.");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  }

  // Instant save suggested card to database
  async function handleSaveAISuggestion(rec: AIRecommendation, index: number) {
    if (savedAiIndices[index]) return; // Already saved

    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rec.name,
          occasion: aiOccasion,
          budget: rec.estimatedPrice,
          notes: `${rec.reason} Recommended by AI. Buy via: ${rec.whereToBuy} (${rec.giftType} Type).`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGifts([data.gift, ...gifts]);
        setSavedAiIndices((prev) => ({ ...prev, [index]: true }));
      } else {
        alert(data.error || "Failed to save recommended gift.");
      }
    } catch (err) {
      console.error("Failed to save recommended gift:", err);
    }
  }

  // Add a gift manually
  async function handleAddGift(e: React.FormEvent) {
    e.preventDefault();
    if (!manualName.trim() || !manualOccasion.trim()) return;

    setAddingGift(true);
    setCrudError("");

    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualName,
          occasion: manualOccasion,
          budget: Number(manualBudget) || 0,
          notes: manualNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGifts([data.gift, ...gifts]);
        // Reset form
        setManualName("");
        setManualOccasion("");
        setManualBudget("");
        setManualNotes("");
      } else {
        setCrudError(data.error || "Failed to add gift");
      }
    } catch (err) {
      setCrudError("Network error. Failed to add gift.");
      console.error(err);
    } finally {
      setAddingGift(false);
    }
  }

  // Toggle purchased state
  async function handleTogglePurchased(id: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/gifts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPurchased: !currentStatus }),
      });

      if (res.ok) {
        setGifts(gifts.map((g) => (g._id === id ? { ...g, isPurchased: !currentStatus } : g)));
      }
    } catch (err) {
      console.error("Toggle purchased state failed:", err);
    }
  }

  // Delete gift
  async function handleDeleteGift(id: string) {
    if (!confirm("Are you sure you want to delete this gift?")) return;

    try {
      const res = await fetch(`/api/gifts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGifts(gifts.filter((g) => g._id !== id));
      } else {
        alert("Failed to delete gift item.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  // Start editing mode
  function handleStartEdit(gift: GiftItem) {
    setEditingId(gift._id);
    setEditName(gift.name);
    setEditOccasion(gift.occasion);
    setEditBudget(gift.budget.toString());
    setEditNotes(gift.notes || "");
  }

  // Save edit changes
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/gifts/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          occasion: editOccasion,
          budget: Number(editBudget) || 0,
          notes: editNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGifts(gifts.map((g) => (g._id === editingId ? data.gift : g)));
        setEditingId(null);
      } else {
        alert(data.error || "Failed to save edits.");
      }
    } catch (err) {
      console.error("Failed to save edits:", err);
    } finally {
      setSavingEdit(false);
    }
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div className="glow-orb-1"></div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", color: "var(--text-secondary)" }}>Loading session...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="glow-orb-1"></div>
      <div className="glow-orb-2"></div>

      {/* Header bar */}
      <header style={{
        display: "flex",
        justifyContent: "between",
        alignItems: "center",
        padding: "1rem 2rem",
        borderBottom: "1px solid var(--border-color)",
        background: "rgba(7, 7, 10, 0.7)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          <Link href="/" style={{ textDecoration: "none", fontSize: "1.35rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🎁</span> AI Gift Finder
          </Link>
          
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Signed in as: <strong style={{ color: "#fff" }}>{user?.email}</strong>
            </span>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content grid */}
      <main style={{ flex: 1, padding: "2.5rem 2rem", maxWidth: "1200px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {crudError && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "8px",
            color: "#f87171",
            padding: "0.75rem 1rem",
            fontSize: "0.9rem"
          }}>
            ⚠️ {crudError}
          </div>
        )}

        {/* Dashboard Panels */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2.5rem",
          alignItems: "start"
        }}>
          
          {/* LEFT PANEL: Structured AI Questionnaire Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* AI Generator Box */}
            <div className="glass-card animate-slide-up" style={{ padding: "1.75rem" }}>
              <h2 style={{ fontSize: "1.35rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🤖</span> AI Gift Generator
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Recipient Profile *</label>
                  <input
                    type="text"
                    placeholder="E.g. My programmer husband, tech-savvy sister"
                    value={aiRecipient}
                    onChange={(e) => setAiRecipient(e.target.value)}
                    className="input-field"
                    required
                    disabled={aiLoading}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Occasion *</label>
                    <select
                      value={aiOccasion}
                      onChange={(e) => setAiOccasion(e.target.value)}
                      className="input-field"
                      style={{ background: "#161622" }}
                      disabled={aiLoading}
                    >
                      <option value="Birthday">Birthday</option>
                      <option value="Christmas">Christmas / Holidays</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Graduation">Graduation</option>
                      <option value="Valentine's Day">Valentine's Day</option>
                      <option value="Housewarming">Housewarming</option>
                      <option value="Other">Other / General</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Max Budget</label>
                    <input
                      type="number"
                      placeholder="E.g. 5000"
                      value={aiBudget}
                      onChange={(e) => setAiBudget(e.target.value)}
                      className="input-field"
                      disabled={aiLoading}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Interests / Hobbies</label>
                  <input
                    type="text"
                    placeholder="E.g. Gaming, keyboards, cooking, hiking"
                    value={aiInterests}
                    onChange={(e) => setAiInterests(e.target.value)}
                    className="input-field"
                    disabled={aiLoading}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Gift Tone</label>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {["Practical", "Sentimental", "Funny/Gag", "Luxury", "Unique"].map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setAiTone(tone)}
                        style={{
                          padding: "0.35rem 0.85rem",
                          borderRadius: "20px",
                          border: "1px solid",
                          borderColor: aiTone === tone ? "var(--accent-primary)" : "var(--border-color)",
                          background: aiTone === tone ? "rgba(124, 58, 237, 0.15)" : "transparent",
                          color: aiTone === tone ? "#c084fc" : "var(--text-secondary)",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        disabled={aiLoading}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleAskAI}
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "0.5rem" }}
                  disabled={aiLoading || !aiRecipient.trim()}
                >
                  {aiLoading ? "Consulting AI Advisor..." : "Generate AI Suggestions"}
                </button>
              </div>

              {aiError && (
                <div style={{ marginTop: "1rem", color: "#f87171", fontSize: "0.85rem" }}>
                  {aiError}
                </div>
              )}
            </div>

            {/* Manual Form Box */}
            <div className="glass-card animate-slide-up" style={{ padding: "1.75rem" }}>
              <h2 style={{ fontSize: "1.35rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>✍️</span> Add Gift Manually
              </h2>
              
              <form onSubmit={handleAddGift} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Gift Name *</label>
                  <input
                    type="text"
                    placeholder="E.g. Custom Novel Keycaps"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="input-field"
                    required
                    disabled={addingGift}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Occasion *</label>
                    <input
                      type="text"
                      placeholder="E.g. Birthday"
                      value={manualOccasion}
                      onChange={(e) => setManualOccasion(e.target.value)}
                      className="input-field"
                      required
                      disabled={addingGift}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Cost / Price</label>
                    <input
                      type="number"
                      placeholder="E.g. 1200"
                      value={manualBudget}
                      onChange={(e) => setManualBudget(e.target.value)}
                      className="input-field"
                      disabled={addingGift}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Notes / Brand / URL</label>
                  <textarea
                    placeholder="Purchasing link, size options, etc..."
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="input-field"
                    style={{ height: "60px", resize: "none" }}
                    disabled={addingGift}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "0.5rem" }}
                  disabled={addingGift || !manualName.trim() || !manualOccasion.trim()}
                >
                  {addingGift ? "Saving..." : "Add to List"}
                </button>
              </form>
            </div>

          </div>

          {/* RIGHT PANEL: AI Generated suggestions deck AND Saved list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* AI Generated Deck */}
            {aiSuggestions.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }} className="animate-fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>✨</span> AI Advisor Choices
                  </h2>
                  <span style={{
                    background: "rgba(124, 58, 237, 0.15)",
                    border: "1px solid rgba(124, 58, 237, 0.2)",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "8px",
                    fontSize: "0.75rem",
                    color: "#c084fc",
                    fontWeight: 600
                  }}>
                    Groq Llama-3.3
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {aiSuggestions.map((rec, index) => (
                    <div
                      key={index}
                      className="glass-card"
                      style={{
                        padding: "1.25rem",
                        background: "rgba(124, 58, 237, 0.03)",
                        border: "1px solid rgba(124, 58, 237, 0.15)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                        <div>
                          <span style={{
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "#fff",
                            fontSize: "0.75rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "6px",
                            fontWeight: 700,
                            marginRight: "0.5rem"
                          }}>
                            {rec.matchPercentage}% Match
                          </span>
                          <span style={{
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--text-secondary)",
                            fontSize: "0.72rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "6px",
                            fontWeight: 600
                          }}>
                            {rec.giftType}
                          </span>
                          
                          <h3 style={{ fontSize: "1.15rem", marginTop: "0.5rem", color: "#fff" }}>
                            {rec.name}
                          </h3>
                        </div>

                        <button
                          onClick={() => handleSaveAISuggestion(rec, index)}
                          className={savedAiIndices[index] ? "btn btn-secondary" : "btn btn-primary"}
                          style={{
                            padding: "0.4rem 0.85rem",
                            fontSize: "0.8rem",
                            cursor: savedAiIndices[index] ? "default" : "pointer"
                          }}
                          disabled={savedAiIndices[index]}
                        >
                          {savedAiIndices[index] ? "✓ Saved" : "➕ Save to List"}
                        </button>
                      </div>

                      <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginTop: "0.75rem", lineHeight: "1.4" }}>
                        {rec.reason}
                      </p>

                      <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.75rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          💰 Est: <strong style={{ color: "#fff" }}>{rec.estimatedPrice > 0 ? rec.estimatedPrice.toLocaleString() : "N/A"}</strong>
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          🛍️ Buy: <strong style={{ color: "#fff" }}>{rec.whereToBuy}</strong>
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Gift Planner List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.5rem" }}>My Saved Gift List</h2>
                <span style={{
                  background: "rgba(255,255,255,0.06)",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "12px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  border: "1px solid var(--border-color)"
                }}>
                  {gifts.length} {gifts.length === 1 ? "item" : "items"}
                </span>
              </div>

              {loadingGifts ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
                  Loading gift list items...
                </div>
              ) : gifts.length === 0 ? (
                <div className="glass-card" style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
                  <h3>Your planner is empty</h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                    Configure the AI Generator to get suggestions, or input some custom gift items manually.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {gifts.map((gift) => (
                    <div
                      key={gift._id}
                      className="glass-card animate-fade-in"
                      style={{
                        padding: "1.5rem",
                        borderLeft: gift.isPurchased
                          ? "4px solid var(--success-color)"
                          : "4px solid var(--accent-primary)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem"
                      }}
                    >
                      
                      {/* EDIT MODE CARD */}
                      {editingId === gift._id ? (
                        <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>Edit Name</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="input-field"
                              required
                            />
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>Edit Occasion</label>
                              <input
                                type="text"
                                value={editOccasion}
                                onChange={(e) => setEditOccasion(e.target.value)}
                                className="input-field"
                                required
                              />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>Edit Cost</label>
                              <input
                                type="number"
                                value={editBudget}
                                onChange={(e) => setEditBudget(e.target.value)}
                                className="input-field"
                              />
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>Edit Notes</label>
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="input-field"
                              style={{ height: "60px", resize: "none" }}
                            />
                          </div>

                          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="btn btn-secondary"
                              style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              style={{ padding: "0.4rem 1.25rem", fontSize: "0.85rem" }}
                              disabled={savingEdit}
                            >
                              {savingEdit ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* READ-ONLY CARD VIEW */
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <input
                                type="checkbox"
                                checked={gift.isPurchased}
                                onChange={() => handleTogglePurchased(gift._id, gift.isPurchased)}
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  cursor: "pointer",
                                  accentColor: "var(--success-color)",
                                  borderRadius: "4px"
                                }}
                              />
                              <div>
                                <h3 style={{
                                  fontSize: "1.15rem",
                                  color: gift.isPurchased ? "var(--text-muted)" : "#fff",
                                  textDecoration: gift.isPurchased ? "line-through" : "none",
                                  wordBreak: "break-word"
                                }}>
                                  {gift.name}
                                </h3>
                                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                                  <span style={{
                                    background: "rgba(124, 58, 237, 0.12)",
                                    color: "#c084fc",
                                    padding: "0.15rem 0.5rem",
                                    borderRadius: "6px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    border: "1px solid rgba(124, 58, 237, 0.2)"
                                  }}>
                                    🏷️ {gift.occasion}
                                  </span>
                                  
                                  {gift.budget > 0 && (
                                    <span style={{
                                      background: "rgba(37, 99, 235, 0.12)",
                                      color: "#60a5fa",
                                      padding: "0.15rem 0.5rem",
                                      borderRadius: "6px",
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      border: "1px solid rgba(37, 99, 235, 0.2)"
                                    }}>
                                      💰 Price: {gift.budget.toLocaleString()}
                                    </span>
                                  )}
                                  
                                  <span style={{
                                    background: gift.isPurchased ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                                    color: gift.isPurchased ? "#34d399" : "#fbbf24",
                                    padding: "0.15rem 0.5rem",
                                    borderRadius: "6px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    border: gift.isPurchased ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(245, 158, 11, 0.2)"
                                  }}>
                                    {gift.isPurchased ? "✓ Purchased" : "● Pending"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                onClick={() => handleStartEdit(gift)}
                                style={{
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "8px",
                                  width: "32px",
                                  height: "32px",
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                                title="Edit gift details"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteGift(gift._id)}
                                style={{
                                  background: "rgba(239, 68, 68, 0.08)",
                                  border: "1px solid rgba(239, 68, 68, 0.15)",
                                  borderRadius: "8px",
                                  width: "32px",
                                  height: "32px",
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                                title="Delete gift"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          {gift.notes && (
                            <div style={{
                              padding: "0.75rem",
                              background: "rgba(0,0,0,0.15)",
                              borderRadius: "8px",
                              fontSize: "0.85rem",
                              color: "var(--text-secondary)",
                              border: "1px solid rgba(255,255,255,0.03)",
                              wordBreak: "break-word"
                            }}>
                              {gift.notes}
                            </div>
                          )}
                        </>
                      )}

                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-color)", padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4rem" }}>
        © {new Date().getFullYear()} Conesta AI Gift Finder. Day 4 AI Planner Hub.
      </footer>
    </div>
  );
}