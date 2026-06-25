"use client";

import { useState } from "react";

export default function GiftsPage() {
  const [giftName, setGiftName] = useState("");
  const [occasion, setOccasion] = useState("");

  const [gifts, setGifts] = useState([
    { id: 1, name: "Watch", occasion: "Birthday" },
    { id: 2, name: "Bible", occasion: "Christmas" },
  ]);

  const addGift = () => {
    if (!giftName || !occasion) return;

    const newGift = {
      id: Date.now(),
      name: giftName,
      occasion,
    };

    setGifts([...gifts, newGift]);

    setGiftName("");
    setOccasion("");
  };

  const deleteGift = (id: number) => {
    setGifts(gifts.filter((gift) => gift.id !== id));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Gift Finder App</h1>

      <input
        type="text"
        placeholder="Gift Name"
        value={giftName}
        onChange={(e) => setGiftName(e.target.value)}
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Occasion"
        value={occasion}
        onChange={(e) => setOccasion(e.target.value)}
      />

      <br />
      <br />

      <button onClick={addGift}>Add Gift</button>

      <hr />

      <h2>Gift List</h2>

      {gifts.map((gift) => (
        <div key={gift.id}>
          <p>
            {gift.name} - {gift.occasion}
          </p>

          <button onClick={() => deleteGift(gift.id)}>
            Delete
          </button>

          <hr />
        </div>
      ))}
    </div>
  );
}