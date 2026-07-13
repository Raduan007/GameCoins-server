import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import "dotenv/config";

import User from "../models/user.model";
import Game from "../models/game.model";
import Package from "../models/package.model";
import Order from "../models/order.model";
import Payment from "../models/payment.model";
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
  console.log("\n💳 Dashboard Payments Verification\n" + "=".repeat(50));
  await connectDB();

  // Cleanup old test users
  await User.deleteMany({
    email: {
      $in: [
        "dashboard-payments-user-a@gamecoins.test",
        "dashboard-payments-user-b@gamecoins.test",
      ],
    },
  });

  // Create test users
  const userA = await User.create({
    name: "Payments User A",
    email: "dashboard-payments-user-a@gamecoins.test",
    password: "Test@123",
    role: "user",
  });

  const userB = await User.create({
    name: "Payments User B",
    email: "dashboard-payments-user-b@gamecoins.test",
    password: "Test@123",
    role: "user",
  });

  const tokenA = makeToken(userA._id.toString(), userA.email, "user");

  // Test 1: Request without token
  console.log("\n🧪 Test 1: Request without token...");
  const t1 = await req("GET", "/dashboard/payments");
  console.log(`➡️ Status: ${t1.status}`);
  if (t1.status === 401) {
    console.log("🟢 PASS: Unauthenticated access blocked correctly.");
  } else {
    console.error("🔴 FAIL: Expected 401 Unauthorized.");
    process.exit(1);
  }

  // Test 2: User with no payments
  console.log("\n🧪 Test 2: Request with valid token (no payments)...");
  const t2 = await req("GET", "/dashboard/payments", undefined, tokenA);
  console.log(`➡️ Status: ${t2.status}`);
  console.log("➡️ Data:", JSON.stringify(t2.data));
  if (
    t2.status === 200 &&
    t2.data?.success &&
    Array.isArray(t2.data?.data) &&
    t2.data?.data.length === 0 &&
    t2.data?.message === "No payments found"
  ) {
    console.log("🟢 PASS: Correct empty payments list response returned.");
  } else {
    console.error("🔴 FAIL: Incorrect response for empty payments list.");
    process.exit(1);
  }

  // Find or create Game and Package
  let game = await Game.findOne({ isActive: true });
  if (!game) {
    game = await Game.create({
      name: "Payments Test Game",
      slug: "payments-test-game",
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
      name: "Payments Test Package",
      amount: 100,
      price: 15,
      isActive: true,
    });
  }

  // Create Orders
  console.log("Seeding test orders and payments...");
  const oA1 = await Order.create({
    user: userA._id,
    game: game._id,
    package: pkg._id,
    playerId: "playerA1",
    quantity: 1,
    unitPrice: 15,
    totalPrice: 15,
    paymentMethod: "bkash",
    paymentStatus: "pending",
    orderStatus: "pending",
  });

  const oA2 = await Order.create({
    user: userA._id,
    game: game._id,
    package: pkg._id,
    playerId: "playerA2",
    quantity: 2,
    unitPrice: 15,
    totalPrice: 30,
    paymentMethod: "nagad",
    paymentStatus: "paid",
    orderStatus: "completed",
  });

  const oB = await Order.create({
    user: userB._id,
    game: game._id,
    package: pkg._id,
    playerId: "playerB",
    quantity: 1,
    unitPrice: 15,
    totalPrice: 15,
    paymentMethod: "sslcommerz",
    paymentStatus: "pending",
    orderStatus: "pending",
  });

  // Create Payments (User A has 2, User B has 1)
  const pA1 = await Payment.create({
    user: userA._id,
    order: oA1._id,
    amount: oA1.totalPrice,
    paymentMethod: "bkash",
    paymentStatus: "pending",
  });

  // Delay slightly to guarantee sorting order
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const pA2 = await Payment.create({
    user: userA._id,
    order: oA2._id,
    amount: oA2.totalPrice,
    paymentMethod: "nagad",
    paymentStatus: "paid",
  });

  const pB = await Payment.create({
    user: userB._id,
    order: oB._id,
    amount: oB.totalPrice,
    paymentMethod: "sslcommerz",
    paymentStatus: "pending",
  });

  // Test 3 & 4: Get User A's payments list & test isolation
  console.log("\n🧪 Test 3 & 4: Fetch User A's payments list (multiple & security isolation)...");
  const t3 = await req("GET", "/dashboard/payments", undefined, tokenA);
  console.log(`➡️ Status: ${t3.status}`);

  if (t3.status !== 200 || !t3.data?.success) {
    console.error("🔴 FAIL: Expected status 200 with success: true.");
    process.exit(1);
  }

  const payments = t3.data?.data;
  if (!Array.isArray(payments) || payments.length !== 2) {
    console.error(`🔴 FAIL: Expected exactly 2 payments for User A, got ${payments?.length}`);
    process.exit(1);
  }

  // Security isolation check: User B's payment must not show up in User A's response
  const containsUserBPayment = payments.some((p: any) => p._id.toString() === pB._id.toString());
  if (containsUserBPayment) {
    console.error("🔴 FAIL (SECURITY): User B's payments were returned to User A.");
    process.exit(1);
  } else {
    console.log("🟢 PASS: Security isolation verified. User B's payments are absent.");
  }

  // Sorting check: newest first (pA2 first, then pA1)
  const isSortedCorrectly =
    payments[0]._id.toString() === pA2._id.toString() &&
    payments[1]._id.toString() === pA1._id.toString();

  if (isSortedCorrectly) {
    console.log("🟢 PASS: Sorting verified. Payments returned in newest-first order.");
  } else {
    console.error("🔴 FAIL: Sorting is incorrect. Expected pA2 first, then pA1.");
    process.exit(1);
  }

  // Population check: order and nested game/package populated
  const firstPayment = payments[0];
  if (
    firstPayment.order &&
    typeof firstPayment.order === "object" &&
    firstPayment.order.game &&
    typeof firstPayment.order.game === "object" &&
    firstPayment.order.game.name === game.name &&
    firstPayment.order.package &&
    typeof firstPayment.order.package === "object" &&
    firstPayment.order.package.name === pkg.name
  ) {
    console.log("🟢 PASS: Populate verified. Order and nested game/package are correctly populated.");
  } else {
    console.error("🔴 FAIL: Populate failed. Order or nested game/package are not populated correctly.");
    process.exit(1);
  }

  // Cleanup test data
  await Payment.deleteMany({ _id: { $in: [pA1._id, pA2._id, pB._id] } });
  await Order.deleteMany({ _id: { $in: [oA1._id, oA2._id, oB._id] } });
  await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });

  console.log("\n🧹 Cleaned up test database resources.");
  await mongoose.disconnect();
  console.log("=".repeat(50));
  console.log("🟢 ALL DASHBOARD PAYMENTS TESTS PASSED!");
  console.log("=".repeat(50) + "\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
