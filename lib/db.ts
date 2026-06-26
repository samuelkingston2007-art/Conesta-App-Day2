import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  // If MONGODB_URI is not set, we immediately return null to trigger mock database fallback
  if (!MONGODB_URI) {
    console.warn("MONGODB_URI is not defined. Using mock database fallback.");
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("Connecting to MongoDB...");
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        console.log("Connected to MongoDB successfully!");
        return m;
      })
      .catch((err) => {
        console.error("MongoDB connection failed:", err.message);
        cached.promise = null;
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.conn = null;
  }

  return cached.conn;
}
