import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Gift from "@/models/Gift";
import { MockDb } from "@/lib/mockDb";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromRequest();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Whitelist updatable fields
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.occasion !== undefined) updateData.occasion = body.occasion;
    if (body.budget !== undefined) updateData.budget = Number(body.budget) || 0;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isPurchased !== undefined) updateData.isPurchased = Boolean(body.isPurchased);

    const dbConnected = await connectDB();
    let updatedGift;

    if (dbConnected) {
      updatedGift = await Gift.findOneAndUpdate(
        { _id: id, userId },
        { $set: updateData },
        { new: true }
      );
      if (!updatedGift) {
        return NextResponse.json(
          { error: "Gift not found or unauthorized to update" },
          { status: 404 }
        );
      }
    } else {
      // Mock DB Fallback
      updatedGift = await MockDb.updateGift(id, userId, updateData);
      if (!updatedGift) {
        return NextResponse.json(
          { error: "Gift not found or unauthorized to update (local mode)" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Gift updated successfully",
      gift: updatedGift,
    });
  } catch (error: any) {
    console.error("PUT gift error:", error);
    return NextResponse.json(
      { error: "Failed to update gift item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromRequest();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const dbConnected = await connectDB();

    if (dbConnected) {
      const deletedGift = await Gift.findOneAndDelete({ _id: id, userId });
      if (!deletedGift) {
        return NextResponse.json(
          { error: "Gift not found or unauthorized to delete" },
          { status: 404 }
        );
      }
    } else {
      // Mock DB Fallback
      const deleted = await MockDb.deleteGift(id, userId);
      if (!deleted) {
        return NextResponse.json(
          { error: "Gift not found or unauthorized to delete (local mode)" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Gift deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE gift error:", error);
    return NextResponse.json(
      { error: "Failed to delete gift item" },
      { status: 500 }
    );
  }
}
