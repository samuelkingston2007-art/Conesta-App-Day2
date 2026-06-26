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

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const dbConnected = await connectDB();

    let userId: string;

    if (dbConnected) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return NextResponse.json(
          { error: "User already exists with this email" },
          { status: 400 }
        );
      }

      const newUser = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
      });
      userId = newUser._id.toString();
    } else {
      // Use Mock DB Fallback
      const existingUser = await MockDb.findUserByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          { error: "User already exists with this email (local mode)" },
          { status: 400 }
        );
      }

      const newUser = await MockDb.createUser(email, hashedPassword);
      userId = newUser._id;
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
      message: "User registered successfully",
      userId,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during registration" },
      { status: 500 }
    );
  }
}
