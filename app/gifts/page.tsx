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

export default function GiftsPage() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // AI state
  const [prompt, setPrompt] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

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

  // Ask AI suggestion
  async function handleAskAI() {
    if (!prompt.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiAnswer("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (res.ok) {
        setAiAnswer(data.response || "No response received from AI.");
      } else {
        setAiError(data.error || "Failed to generate recommendation. Try again.");
      }
    } catch (err) {
      setAiError("Network error. Could not contact AI services.");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  }

  // Quick save from AI answer
  async function handleSaveAISuggestion() {
    if (!aiAnswer) return;
    
    // Attempt to extract a gift name from the recommendation summary or prompt
    let suggestedName = "AI Recommended Gift";
    let suggestedOccasion = "General";

    // Simple heuristic parser for name
    const lines = aiAnswer.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- **") || trimmed.startsWith("1. **") || trimmed.startsWith("**")) {
        const match = trimmed.match(/\*\*(.*?)\*\*/);
        if (match && match[1]) {
          suggestedName = match[1];
          break;
        }
      }
    }

    // Heuristic parser for occasion from user prompt
    const lowercasePrompt = prompt.toLowerCase();
    if (lowercasePrompt.includes("birthday")) suggestedOccasion = "Birthday";
    else if (lowercasePrompt.includes("christmas")) suggestedOccasion = "Christmas";
    else if (lowercasePrompt.includes("anniversary")) suggestedOccasion = "Anniversary";
    else if (lowercasePrompt.includes("wedding")) suggestedOccasion = "Wedding";
    else if (lowercasePrompt.includes("graduation")) suggestedOccasion = "Graduation";

    setManualName(suggestedName);
    setManualOccasion(suggestedOccasion);
    setManualNotes(aiAnswer.substring(0, 300) + (aiAnswer.length > 300 ? "..." : ""));
    
    // Focus the manual add card or prefill it
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }} className="hidden sm:inline">
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

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2.5rem",
          alignItems: "start"
        }}>
          
          {/* LEFT PANEL: Generator & Manual creation form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* AI Generator Box */}
            <div className="glass-card animate-slide-up" style={{ padding: "1.75rem" }}>
              <h2 style={{ fontSize: "1.35rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🤖</span> AI Gift Assistant
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <textarea
                  placeholder="Describe who you are buying for, their interests, and any budget limits. E.g., 'Gift for my mom who loves gardening and cooking under ₹3000'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="input-field"
                  style={{ height: "110px", resize: "none" }}
                  disabled={aiLoading}
                />
                
                <button
                  onClick={handleAskAI}
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  disabled={aiLoading || !prompt.trim()}
                >
                  {aiLoading ? "Consulting AI..." : "Generate Recommendations"}
                </button>
              </div>

              {aiError && (
                <div style={{ marginTop: "1rem", color: "#f87171", fontSize: "0.85rem" }}>
                  {aiError}
                </div>
              )}

              {aiAnswer && (
                <div style={{
                  marginTop: "1.5rem",
                  background: "rgba(0, 0, 0, 0.25)",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  border: "1px solid var(--border-color)",
                  position: "relative"
                }} className="animate-fade-in">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>AI Suggestion Output:</span>
                    <button
                      onClick={handleSaveAISuggestion}
                      className="btn btn-secondary"
                      style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                    >
                      ✨ Prefill Form Below
                    </button>
                  </div>
                  <p style={{
                    fontSize: "0.9rem",
                    color: "var(--text-primary)",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap"
                  }}>
                    {aiAnswer}
                  </p>
                </div>
              )}
            </div>

            {/* Manual Form Box */}
            <div className="glass-card animate-slide-up" style={{ padding: "1.75rem" }}>
              <h2 style={{ fontSize: "1.35rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>✍️</span> Add Gift Item
              </h2>
              
              <form onSubmit={handleAddGift} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Gift Name *</label>
                  <input
                    type="text"
                    placeholder="E.g. Gardening Spade Set"
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
                      placeholder="E.g. Birthday, Xmas"
                      value={manualOccasion}
                      onChange={(e) => setManualOccasion(e.target.value)}
                      className="input-field"
                      required
                      disabled={addingGift}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Budget (Cost)</label>
                    <input
                      type="number"
                      placeholder="E.g. 2500"
                      value={manualBudget}
                      onChange={(e) => setManualBudget(e.target.value)}
                      className="input-field"
                      disabled={addingGift}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Notes / URL / Description</label>
                  <textarea
                    placeholder="Details about brand, size, or purchasing link..."
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="input-field"
                    style={{ height: "70px", resize: "none" }}
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

          {/* RIGHT PANEL: Saved Gift Lists (Dashboard CRUD) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
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
                <h3>Your gift list is empty</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Use the AI Assistant to generate ideas, or add some custom items manually using the form.
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
                            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>Edit Budget</label>
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
                                    💰 Budget: {gift.budget.toLocaleString()}
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

      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-color)", padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4rem" }}>
        © {new Date().getFullYear()} Conesta AI Gift Finder. Dashboard view.
      </footer>
    </div>
  );
}