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
  console.log("\n📊 Dashboard Overview Verification\n" + "=".repeat(50));
  await connectDB();

  // Cleanup old test data
  await User.deleteMany({ email: "dashboard-test-user@gamecoins.test" });

  // Create a test user
  const user = await User.create({
    name: "Dashboard User",
    email: "dashboard-test-user@gamecoins.test",
    password: "Test@123",
    role: "user",
  });

  const token = makeToken(user._id.toString(), user.email, "user");

  // Step 1: No token
  console.log("\n🧪 Test 1: Access without token...");
  const r1 = await req("GET", "/dashboard/overview");
  console.log(`➡️ Status: ${r1.status}`);
  if (r1.status === 401) {
    console.log("🟢 SUCCESS: Unauthenticated access blocked.");
  } else {
    console.error("🔴 FAILURE: Expected 401 Unauthorized.");
    process.exit(1);
  }

  // Step 2: Empty overview
  console.log("\n🧪 Test 2: Access with token (empty history)...");
  const r2 = await req("GET", "/dashboard/overview", undefined, token);
  console.log(`➡️ Status: ${r2.status}`);
  console.log("➡️ Data:", JSON.stringify(r2.data));
  if (
    r2.status === 200 &&
    r2.data?.success &&
    r2.data?.data?.totalOrders === 0 &&
    r2.data?.data?.totalSpent === 0 &&
    r2.data?.data?.pendingOrders === 0 &&
    r2.data?.data?.completedOrders === 0
  ) {
    console.log("🟢 SUCCESS: Correct empty dashboard summary returned.");
  } else {
    console.error("🔴 FAILURE: Incorrect empty summary returned.");
    process.exit(1);
  }

  // Find or create an active game and package to associate orders with
  let game = await Game.findOne({ isActive: true });
  if (!game) {
    game = await Game.create({
      title: "Dashboard Test Game",
      image: "https://example.com/game.png",
      isActive: true,
      description: "Test description",
    });
  }

  let pkg = await Package.findOne({ game: game._id, isActive: true });
  if (!pkg) {
    pkg = await Package.create({
      game: game._id,
      title: "Dashboard Test Package",
      price: 15,
      isActive: true,
    });
  }

  // Let's create orders:
  // Order 1: pending / payment pending, totalPrice = 15
  const o1 = await Order.create({
    user: user._id,
    game: game._id,
    package: pkg._id,
    playerId: "player1",
    quantity: 1,
    unitPrice: 15,
    totalPrice: 15,
    paymentMethod: "bkash",
    paymentStatus: "pending",
    orderStatus: "pending",
  });

  // Order 2: completed / paid, totalPrice = 30
  const o2 = await Order.create({
    user: user._id,
    game: game._id,
    package: pkg._id,
    playerId: "player1",
    quantity: 2,
    unitPrice: 15,
    totalPrice: 30,
    paymentMethod: "nagad",
    paymentStatus: "paid",
    orderStatus: "completed",
  });

  // Order 3: processing / paid, totalPrice = 45
  const o3 = await Order.create({
    user: user._id,
    game: game._id,
    package: pkg._id,
    playerId: "player1",
    quantity: 3,
    unitPrice: 15,
    totalPrice: 45,
    paymentMethod: "sslcommerz",
    paymentStatus: "paid",
    orderStatus: "processing",
  });

  // Order 4: cancelled / failed, totalPrice = 15
  const o4 = await Order.create({
    user: user._id,
    game: game._id,
    package: pkg._id,
    playerId: "player1",
    quantity: 1,
    unitPrice: 15,
    totalPrice: 15,
    paymentMethod: "bkash",
    paymentStatus: "failed",
    orderStatus: "cancelled",
  });

  // Now verify aggregation
  // Total orders: 4
  // Pending orders: 1 (o1)
  // Completed orders: 1 (o2)
  // Total spent: 30 (o2) + 45 (o3) = 75 (orders where paymentStatus is "paid")
  console.log("\n🧪 Test 3: Access with token (populated history)...");
  const r3 = await req("GET", "/dashboard/overview", undefined, token);
  console.log(`➡️ Status: ${r3.status}`);
  console.log("➡️ Data:", JSON.stringify(r3.data));

  if (
    r3.status === 200 &&
    r3.data?.success &&
    r3.data?.data?.totalOrders === 4 &&
    r3.data?.data?.totalSpent === 75 &&
    r3.data?.data?.pendingOrders === 1 &&
    r3.data?.data?.completedOrders === 1
  ) {
    console.log("🟢 SUCCESS: Correct dashboard overview values aggregation.");
  } else {
    console.error("🔴 FAILURE: Incorrect dashboard overview aggregation.");
    console.error(`Expected: totalOrders=4, totalSpent=75, pendingOrders=1, completedOrders=1`);
    console.error(`Got: totalOrders=${r3.data?.data?.totalOrders}, totalSpent=${r3.data?.data?.totalSpent}, pendingOrders=${r3.data?.data?.pendingOrders}, completedOrders=${r3.data?.data?.completedOrders}`);
    process.exit(1);
  }

  // Cleanup test data
  await Order.deleteMany({ _id: { $in: [o1._id, o2._id, o3._id, o4._id] } });
  await User.deleteOne({ _id: user._id });

  console.log("\n🧹 Cleaned up test database resources.");
  await mongoose.disconnect();
  console.log("=".repeat(50));
  console.log("🟢 ALL DASHBOARD OVERVIEW TESTS PASSED!");
  console.log("=".repeat(50) + "\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
