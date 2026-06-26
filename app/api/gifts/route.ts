import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Gift from "@/models/Gift";
import { MockDb } from "@/lib/mockDb";

export async function GET() {
  try {
    const userId = await getUserFromRequest();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbConnected = await connectDB();
    let giftsList = [];

    if (dbConnected) {
      giftsList = await Gift.find({ userId }).sort({ createdAt: -1 });
    } else {
      // Mock DB Fallback
      giftsList = await MockDb.getGifts(userId);
    }

    return NextResponse.json({ success: true, gifts: giftsList });
  } catch (error: any) {
    console.error("GET gifts error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve gifts list" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserFromRequest();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, occasion, budget, notes } = await request.json();

    if (!name || !occasion) {
      return NextResponse.json(
        { error: "Gift name and occasion are required" },
        { status: 400 }
      );
    }

    const numericBudget = Number(budget) || 0;
    const dbConnected = await connectDB();
    let newGift;

    if (dbConnected) {
      newGift = await Gift.create({
        userId,
        name,
        occasion,
        budget: numericBudget,
        notes: notes || "",
        isPurchased: false,
      });
    } else {
      // Mock DB Fallback
      newGift = await MockDb.addGift(userId, {
        name,
        occasion,
        budget: numericBudget,
        notes: notes || "",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Gift added successfully",
      gift: newGift,
    });
  } catch (error: any) {
    console.error("POST gifts error:", error);
    return NextResponse.json(
      { error: "Failed to save new gift item" },
      { status: 500 }
    );
  }
}
