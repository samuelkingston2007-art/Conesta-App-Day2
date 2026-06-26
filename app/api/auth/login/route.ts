import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { MockDb } from "@/lib/mockDb";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const dbConnected = await connectDB();
    let userId: string;
    let passwordHash: string;

    if (dbConnected) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 400 }
        );
      }
      userId = user._id.toString();
      passwordHash = user.password;
    } else {
      // Mock DB Fallback
      const user = await MockDb.findUserByEmail(email);
      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or password (local mode)" },
          { status: 400 }
        );
      }
      userId = user._id;
      passwordHash = user.passwordHash;
    }

    const isMatch = await bcrypt.compare(password, passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }

    // Sign token and set session cookie
    const token = signToken(userId);
    const cookieStore = await cookies();
    cookieStore.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Logged in successfully",
      userId,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during sign in" },
      { status: 500 }
    );
  }
}
