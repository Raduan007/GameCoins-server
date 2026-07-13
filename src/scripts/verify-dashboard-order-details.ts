import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import "dotenv/config";

import User from "../models/user.model";
import Game from "../models/game.model";
import Package from "../models/package.model";
import Order from "../models/order.model";
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
  console.log("\n🔍 Dashboard Order Details Verification\n" + "=".repeat(50));
  await connectDB();

  // Cleanup old test users
  await User.deleteMany({
    email: {
      $in: [
        "dashboard-details-user-a@gamecoins.test",
        "dashboard-details-user-b@gamecoins.test",
      ],
    },
  });

  // Create test users
  const userA = await User.create({
    name: "Details User A",
    email: "dashboard-details-user-a@gamecoins.test",
    password: "Test@123",
    role: "user",
  });

  const userB = await User.create({
    name: "Details User B",
    email: "dashboard-details-user-b@gamecoins.test",
    password: "Test@123",
    role: "user",
  });

  const tokenA = makeToken(userA._id.toString(), userA.email, "user");
  const tokenB = makeToken(userB._id.toString(), userB.email, "user");

  // Find or create Game and Package
  let game = await Game.findOne({ isActive: true });
  if (!game) {
    game = await Game.create({
      name: "Details Test Game",
      slug: "details-test-game",
      shortDescription: "Short desc",
      fullDescription: "Full desc",
      category: "Action",
      platform: "PC",
      publisher: "Test Pub",
      logo: "https://example.com/logo.png",
      banner: "https://example.com/banner.png",
      isActive: true,
    });
  }

  let pkg = await Package.findOne({ game: game._id, isActive: true });
  if (!pkg) {
    pkg = await Package.create({
      game: game._id,
      name: "Details Test Package",
      amount: 100,
      price: 15,
      isActive: true,
    });
  }

  // Create an order for User A
  const orderA = await Order.create({
    user: userA._id,
    game: game._id,
    package: pkg._id,
    playerId: "playerA",
    quantity: 1,
    unitPrice: 15,
    totalPrice: 15,
    paymentMethod: "bkash",
    paymentStatus: "pending",
    orderStatus: "pending",
  });

  const orderIdA = orderA._id.toString();

  // Test 1: Request without token
  console.log("\n🧪 Test 1: Request without token...");
  const t1 = await req("GET", `/dashboard/orders/${orderIdA}`);
  console.log(`➡️ Status: ${t1.status}`);
  if (t1.status === 401) {
    console.log("🟢 PASS: Unauthenticated access blocked correctly.");
  } else {
    console.error("🔴 FAIL: Expected 401 Unauthorized.");
    process.exit(1);
  }

  // Test 2: Valid user token + own order id
  console.log("\n🧪 Test 2: Request own order with valid token...");
  const t2 = await req("GET", `/dashboard/orders/${orderIdA}`, undefined, tokenA);
  console.log(`➡️ Status: ${t2.status}`);
  console.log("➡️ Data:", JSON.stringify(t2.data));
  if (
    t2.status === 200 &&
    t2.data?.success &&
    t2.data?.data?._id === orderIdA &&
    t2.data?.data?.game?.name === game.name &&
    t2.data?.data?.package?.name === pkg.name
  ) {
    console.log("🟢 PASS: Successfully fetched own order with populated game and package.");
  } else {
    console.error("🔴 FAIL: Failed to fetch own order details or populate fields.");
    process.exit(1);
  }

  // Test 3: User tries another user's order
  console.log("\n🧪 Test 3: Request another user's order...");
  const t3 = await req("GET", `/dashboard/orders/${orderIdA}`, undefined, tokenB);
  console.log(`➡️ Status: ${t3.status}`);
  if (t3.status === 404 && t3.data?.success === false && t3.data?.error === "Order not found") {
    console.log("🟢 PASS: Blocked access to other user's order with 404 Not Found.");
  } else {
    console.error("🔴 FAIL: Expected 404 Order not found.");
    process.exit(1);
  }

  // Test 4: Invalid order id
  console.log("\n🧪 Test 4: Request invalid order ID...");
  const t4 = await req("GET", `/dashboard/orders/12345`, undefined, tokenA);
  console.log(`➡️ Status: ${t4.status}`);
  if (t4.status === 400 && t4.data?.success === false && t4.data?.error === "Invalid order ID") {
    console.log("🟢 PASS: Correctly blocked invalid ID with 400 Bad Request.");
  } else {
    console.error("🔴 FAIL: Expected 400 Invalid order ID.");
    process.exit(1);
  }

  // Cleanup test data
  await Order.deleteOne({ _id: orderA._id });
  await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });

  console.log("\n🧹 Cleaned up test database resources.");
  await mongoose.disconnect();
  console.log("=".repeat(50));
  console.log("🟢 ALL DASHBOARD ORDER DETAILS TESTS PASSED!");
  console.log("=".repeat(50) + "\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
