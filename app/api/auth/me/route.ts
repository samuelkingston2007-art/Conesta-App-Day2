import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { MockDb } from "@/lib/mockDb";

export async function GET() {
  try {
    const userId = await getUserFromRequest();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", authenticated: false },
        { status: 401 }
      );
    }

    const dbConnected = await connectDB();
    let email = "";

    if (dbConnected) {
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return NextResponse.json(
          { error: "User not found", authenticated: false },
          { status: 404 }
        );
      }
      email = user.email;
    } else {
      // Mock DB Fallback
      const user = await MockDb.findUserById(userId);
      if (!user) {
        return NextResponse.json(
          { error: "User not found (local mode)", authenticated: false },
          { status: 404 }
        );
      }
      email = user.email;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        email,
      },
    });
  } catch (error) {
    console.error("Auth status error:", error);
    return NextResponse.json(
      { error: "An error occurred checking authentication state" },
      { status: 500 }
    );
  }
}
