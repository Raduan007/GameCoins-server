/**
 * Verification script: verify-admin-actions.ts
 *
 * Tests:
 *  1. Admin suspends user -> User cannot log in (403/descriptive message).
 *  2. Admin blocks user -> User cannot log in (403/descriptive message).
 *  3. Admin activates user -> User can log in successfully.
 *  4. Admin approves payment -> Payment status = approved/paid, Order status = completed/paid.
 *  5. Admin rejects payment -> Payment status = rejected/failed, Order status = cancelled/failed.
 */

import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import "dotenv/config";

import User from "../models/user.model";
import Game from "../models/game.model";
import Package from "../models/package.model";
import Order from "../models/order.model";
import Payment from "../models/payment.model";
import connectDB from "../config/db";

const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET!;

let passed = 0;
let failed = 0;

function check(msg: string, condition: boolean, details?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${msg}`);
  } else {
    failed++;
    console.log(`  ❌ FAIL: ${msg} ${details ? `(${details})` : ""}`);
  }
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

async function run() {
  let listener: any;
  let testUserId: string = "";
  let testPaymentId: string = "";
  let testOrderId: string = "";
  let adminEmail: string = "";
  let userEmail: string = "";

  try {
    await connectDB();
    console.log("✅ Database connected successfully.");

    // Start express app in-process if not already running on port 5000
    try {
      const ping = await fetch("http://localhost:5000/health").catch(() => null);
      if (ping && ping.ok) {
        console.log("📡 Server is already running on port 5000. Reusing it.");
      } else {
        const app = require("../index").default;
        listener = app.listen(5000);
        console.log("🚀 Started local test server on port 5000.");
      }
    } catch {
      const app = require("../index").default;
      listener = app.listen(5000);
      console.log("🚀 Started local test server on port 5000.");
    }

    // 1. Seed admin and normal user
    adminEmail = `admin-action-${Date.now()}@gamecoins.test`;
    userEmail = `user-action-${Date.now()}@gamecoins.test`;
    const password = "Password123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name: "Admin Action",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    const user = await User.create({
      name: "User Action",
      email: userEmail,
      password: hashedPassword,
      role: "user",
    });
    testUserId = user._id.toString();

    const adminToken = jwt.sign(
      { userId: admin._id.toString(), email: adminEmail, role: "admin" },
      JWT_SECRET
    );

    console.log("\n🧪 Test 1: Admin suspends user account");
    const r1 = await req("PATCH", `/admin/users/${testUserId}/suspend`, {}, adminToken);
    check("Status code is 200", r1.status === 200);
    check("User status updated in DB", r1.data?.data?.status === "suspended");

    // Attempt user login
    const loginRes1 = await req("POST", "/auth/login", { email: userEmail, password });
    check("Login rejected with 403", loginRes1.status === 403);
    check(" Descript error message returned", loginRes1.data?.error?.includes("suspended"));

    console.log("\n🧪 Test 2: Admin blocks user account");
    const r2 = await req("PATCH", `/admin/users/${testUserId}/block`, {}, adminToken);
    check("Status code is 200", r2.status === 200);
    check("User status updated in DB", r2.data?.data?.status === "blocked");

    // Attempt user login
    const loginRes2 = await req("POST", "/auth/login", { email: userEmail, password });
    check("Login rejected with 403", loginRes2.status === 403);
    check("Descriptive error message returned", loginRes2.data?.error?.includes("blocked"));

    console.log("\n🧪 Test 3: Admin activates user account");
    const r3 = await req("PATCH", `/admin/users/${testUserId}/activate`, {}, adminToken);
    check("Status code is 200", r3.status === 200);
    check("User status updated in DB", r3.data?.data?.status === "active");

    // Attempt user login
    const loginRes3 = await req("POST", "/auth/login", { email: userEmail, password });
    check("Login succeeds with 200", loginRes3.status === 200);

    // 2. Seed game, package, order, payment
    const game = await Game.create({
      name: "Test Action Game",
      slug: `game-action-${Date.now()}`,
      category: "Mobile",
      platform: "Android",
      shortDescription: "Test game description",
      fullDescription: "Full test game description",
      publisher: "Test Publisher",
      logo: "https://placehold.co/64x64/png",
      banner: "https://placehold.co/800x300/png",
      isActive: true,
    });

    const pkg = await Package.create({
      name: "Test Action Package",
      price: 15.99,
      amount: 100,
      game: game._id,
    });

    const order = await Order.create({
      user: testUserId,
      game: game._id,
      package: pkg._id,
      playerId: "player-999",
      playerName: "Action Player",
      quantity: 1,
      unitPrice: 15.99,
      totalPrice: 15.99,
      paymentMethod: "bkash",
      paymentStatus: "pending",
      orderStatus: "pending",
    });
    testOrderId = order._id.toString();

    const payment = await Payment.create({
      user: testUserId,
      order: testOrderId,
      amount: 15.99,
      paymentMethod: "bkash",
      paymentStatus: "pending",
      status: "pending",
    });
    testPaymentId = payment._id.toString();

    console.log("\n🧪 Test 4: Admin approves payment");
    const r4 = await req("PATCH", `/admin/payments/${testPaymentId}/approve`, {}, adminToken);
    check("Status code is 200", r4.status === 200);
    check("Payment status is approved", r4.data?.data?.status === "approved");
    check("Payment paymentStatus is paid", r4.data?.data?.paymentStatus === "paid");

    const updatedOrder4 = await Order.findById(testOrderId);
    check("Order paymentStatus synced to paid", updatedOrder4?.paymentStatus === "paid");
    check("Order orderStatus synced to completed", updatedOrder4?.orderStatus === "completed");

    // Reset payment/order to pending for rejection test
    payment.status = "pending";
    payment.paymentStatus = "pending";
    await payment.save();
    order.paymentStatus = "pending";
    order.orderStatus = "pending";
    await order.save();

    console.log("\n🧪 Test 5: Admin rejects payment");
    const r5 = await req("PATCH", `/admin/payments/${testPaymentId}/reject`, {}, adminToken);
    check("Status code is 200", r5.status === 200);
    check("Payment status is rejected", r5.data?.data?.status === "rejected");
    check("Payment paymentStatus is failed", r5.data?.data?.paymentStatus === "failed");

    const updatedOrder5 = await Order.findById(testOrderId);
    check("Order paymentStatus remains unpaid/failed", updatedOrder5?.paymentStatus === "failed");
    check("Order orderStatus set to cancelled", updatedOrder5?.orderStatus === "cancelled");

    console.log("\n==================================================");
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);
    console.log("==================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Fatal error in verification script:", err);
    process.exit(1);
  } finally {
    // Cleanup
    if (testPaymentId) await Payment.findByIdAndDelete(testPaymentId).catch(() => {});
    if (testOrderId) await Order.findByIdAndDelete(testOrderId).catch(() => {});
    await Package.deleteMany({ name: "Test Action Package" }).catch(() => {});
    await Game.deleteMany({ name: "Test Action Game" }).catch(() => {});
    await User.deleteMany({ email: { $in: [userEmail, adminEmail] } }).catch(() => {});

    if (listener) listener.close();
    await mongoose.disconnect();
    console.log("🧹 Cleanup completed.");
  }
}

run();
