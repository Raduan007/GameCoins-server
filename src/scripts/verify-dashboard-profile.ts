import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import "dotenv/config";

import User from "../models/user.model";
import connectDB from "../config/db";

const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET!;

function makeToken(userId: string, email: string, role: "user" | "admin"): string {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: "1h" });
}

async function req(
  method: string,
  path: string,
  body?: object,
  token?: string
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  console.log("\n👤 Dashboard Profile Verification\n" + "=".repeat(50));
  await connectDB();

  // Cleanup old test users
  await User.deleteMany({ email: "dashboard-profile-user@gamecoins.test" });

  // Create test user
  const user = await User.create({
    name: "Original Profile User",
    email: "dashboard-profile-user@gamecoins.test",
    password: "TestPassword123",
    role: "user",
  });

  const token = makeToken(user._id.toString(), user.email, "user");

  // Test 1: Request without token
  console.log("\n🧪 Test 1: Request profile details without token...");
  const t1 = await req("GET", "/dashboard/profile");
  console.log(`➡️ Status: ${t1.status}`);
  if (t1.status === 401) {
    console.log("🟢 PASS: Unauthenticated access blocked correctly.");
  } else {
    console.error("🔴 FAIL: Expected 401 Unauthorized.");
    process.exit(1);
  }

  // Test 2: Get profile with valid token
  console.log("\n🧪 Test 2: Request profile with valid token...");
  const t2 = await req("GET", "/dashboard/profile", undefined, token);
  console.log(`➡️ Status: ${t2.status}`);
  console.log("➡️ Data:", JSON.stringify(t2.data));
  if (
    t2.status === 200 &&
    t2.data?.success &&
    t2.data?.data?.name === "Original Profile User" &&
    t2.data?.data?.email === "dashboard-profile-user@gamecoins.test" &&
    t2.data?.data?.role === "user" &&
    t2.data?.data?.password === undefined
  ) {
    console.log("🟢 PASS: Profile details successfully retrieved, sensitive fields omitted.");
  } else {
    console.error("🔴 FAIL: Failed to retrieve profile or security omitted fields failed.");
    process.exit(1);
  }

  // Test 3: Update profile name
  console.log("\n🧪 Test 3: Update profile name...");
  const t3 = await req("PATCH", "/dashboard/profile", { name: "Updated Test User" }, token);
  console.log(`➡️ Status: ${t3.status}`);
  console.log("➡️ Data:", JSON.stringify(t3.data));
  if (
    t3.status === 200 &&
    t3.data?.success &&
    t3.data?.data?.name === "Updated Test User" &&
    t3.data?.message === "Profile updated successfully"
  ) {
    console.log("🟢 PASS: Name updated successfully.");
  } else {
    console.error("🔴 FAIL: Failed to update name.");
    process.exit(1);
  }

  // Double check in database
  const dbUser = await User.findById(user._id);
  if (dbUser?.name === "Updated Test User") {
    console.log("🟢 PASS: Name changed in database correctly.");
  } else {
    console.error("🔴 FAIL: Name did not update in database.");
    process.exit(1);
  }

  // Test 4: Try updating email
  console.log("\n🧪 Test 4: Attempt updating email parameter...");
  const t4 = await req("PATCH", "/dashboard/profile", { name: "Updated Name", email: "hack@test.com" }, token);
  console.log(`➡️ Status: ${t4.status}`);
  console.log("➡️ Data:", JSON.stringify(t4.data));
  const dbUserAfterEmailHack = await User.findById(user._id);
  if (dbUserAfterEmailHack?.email === "dashboard-profile-user@gamecoins.test") {
    console.log("🟢 PASS: Email remained unchanged, protection active.");
  } else {
    console.error("🔴 FAIL: Security breach! User email was updated.");
    process.exit(1);
  }

  // Test 5: Try empty name
  console.log("\n🧪 Test 5: Attempt updating with empty name...");
  const t5 = await req("PATCH", "/dashboard/profile", { name: "" }, token);
  console.log(`➡️ Status: ${t5.status}`);
  console.log("➡️ Data:", JSON.stringify(t5.data));
  if (t5.status === 400 && t5.data?.success === false && t5.data?.error === "Name is required") {
    console.log("🟢 PASS: Rejected empty name with 400 Bad Request correctly.");
  } else {
    console.error("🔴 FAIL: Expected 400 Name is required.");
    process.exit(1);
  }

  // Clean up remaining test data
  await User.deleteOne({ _id: user._id });

  console.log("\n🧹 Cleaned up test database resources.");
  await mongoose.disconnect();
  console.log("=".repeat(50));
  console.log("🟢 ALL PROFILE MANAGEMENT TESTS PASSED!");
  console.log("=".repeat(50) + "\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
