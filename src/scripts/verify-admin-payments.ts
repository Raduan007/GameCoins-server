import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import "dotenv/config";
import connectDB from "../config/db";
import User from "../models/user.model";
import Game from "../models/game.model";
import Package from "../models/package.model";
import Order from "../models/order.model";
import Payment from "../models/payment.model";
import app from "../index";

async function runVerification() {
  console.log("==================================================");
  console.log("🚀 Starting Admin Payment Management Verification");
  console.log("==================================================");

  let listener: any;
  let testPaymentId: string | null = null;
  let testOrderId: string | null = null;
  const userEmail = "test-pay-user@gamecoins.com";
  const adminEmail = "test-pay-admin@gamecoins.com";

  try {
    await connectDB();
    console.log("✅ Database connected successfully.");

    // Aggressive cleanup of all stale test data from any prior runs
    await Payment.deleteMany({ transactionId: "TXN-VERIFY-001" }).catch(() => {});
    await Order.deleteMany({ playerId: "pay-verify-player-001" }).catch(() => {});
    await Package.deleteMany({ name: "Payment Test Package" }).catch(() => {});
    await Game.deleteMany({ slug: "test-payment-game" }).catch(() => {});
    await Game.deleteMany({ name: "Payment Test Game" }).catch(() => {});
    await User.deleteMany({ email: { $in: [userEmail, adminEmail] } }).catch(() => {});

    // Create fresh test data
    const testUser = await User.create({
      name: "Payment Test Buyer",
      email: userEmail,
      password: "mocked_hashed_password",
      role: "user",
      isActive: true,
    });

    const testAdmin = await User.create({
      name: "Payment Test Admin",
      email: adminEmail,
      password: "mocked_hashed_password",
      role: "admin",
      isActive: true,
    });

    const jwtSecret = process.env.JWT_SECRET || "super_secret_gamecoins_key";

    const userToken = jwt.sign(
      { userId: testUser._id.toString(), email: testUser.email, role: testUser.role },
      jwtSecret,
      { expiresIn: "1h" }
    );

    const adminToken = jwt.sign(
      { userId: testAdmin._id.toString(), email: testAdmin.email, role: testAdmin.role },
      jwtSecret,
      { expiresIn: "1h" }
    );

    const testGame = await Game.create({
      name: "Payment Test Game",
      slug: "test-payment-game",
      shortDescription: "Test game for payment verification",
      fullDescription: "Full description for payment verification test game.",
      category: "Test",
      platform: "PC",
      publisher: "Test Publisher",
      logo: "https://placehold.co/64x64/png",
      banner: "https://placehold.co/800x300/png",
      isActive: true,
    });

    const testPackage = await Package.create({
      name: "Payment Test Package",
      game: testGame._id,
      description: "Test package for payment verification",
      amount: 500,
      price: 49.99,
      currency: "USD",
      isActive: true,
    });

    const testOrder = await Order.create({
      user: testUser._id,
      game: testGame._id,
      package: testPackage._id,
      playerId: "pay-verify-player-001",
      playerName: "PayVerifyPlayer",
      quantity: 1,
      unitPrice: testPackage.price,
      totalPrice: testPackage.price,
      paymentMethod: "bkash",
      paymentStatus: "pending",
      orderStatus: "pending",
    });
    testOrderId = testOrder._id.toString();

    const testPayment = await Payment.create({
      user: testUser._id,
      order: testOrder._id,
      amount: testPackage.price,
      paymentMethod: "bkash",
      paymentStatus: "pending",
      transactionId: "TXN-VERIFY-001",
    });
    testPaymentId = testPayment._id.toString();
    console.log(`✅ Test payment created: ${testPaymentId}`);

    listener = app.listen(0);
    const port = (listener.address() as any).port;
    const BASE = `http://127.0.0.1:${port}/api/dashboard/admin`;

    async function req(
      method: string,
      url: string,
      token?: string,
      body?: object
    ): Promise<{ status: number; data: any }> {
      const opts: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      };
      const res = await fetch(url, opts);
      let data: any = null;
      try {
        data = await res.json();
      } catch {}
      return { status: res.status, data };
    }

    let passed = 0;
    let failed = 0;

    function check(label: string, condition: boolean, detail?: string) {
      if (condition) {
        console.log(`  ✅ PASS: ${label}`);
        passed++;
      } else {
        console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
        failed++;
      }
    }

    console.log("\n📋 Test 1: Unauthenticated request → 401");
    const r1 = await req("GET", `${BASE}/payments`);
    check("GET /payments without token → 401", r1.status === 401, `got ${r1.status}`);

    console.log("\n📋 Test 2: Non-admin request → 403");
    const r2 = await req("GET", `${BASE}/payments`, userToken);
    check("GET /payments with buyer token → 403", r2.status === 403, `got ${r2.status}`);

    console.log("\n📋 Test 3: Admin list payments → 200");
    const r3 = await req("GET", `${BASE}/payments`, adminToken);
    check("GET /payments with admin token → 200", r3.status === 200, `got ${r3.status}`);
    check("Response has payments array", Array.isArray(r3.data?.data?.payments), `got ${typeof r3.data?.data?.payments}`);
    check("Response has pagination", typeof r3.data?.data?.pagination === "object");

    console.log("\n📋 Test 4: Search works");
    const r4 = await req("GET", `${BASE}/payments?search=TXN-VERIFY-001`, adminToken);
    check("Search by transactionId returns results", r4.status === 200, `got ${r4.status}`);
    
    const r4_order = await req("GET", `${BASE}/payments?search=${testOrderId}`, adminToken);
    check("Search by orderId returns results", r4_order.status === 200 && r4_order.data?.data?.payments?.length > 0, `got ${r4_order.status}`);

    console.log("\n📋 Test 5: Filter by paymentMethod");
    const r5 = await req("GET", `${BASE}/payments?paymentMethod=bkash`, adminToken);
    check("Filter by paymentMethod=bkash → 200", r5.status === 200, `got ${r5.status}`);

    console.log("\n📋 Test 6: Filter by paymentStatus");
    const r6 = await req("GET", `${BASE}/payments?paymentStatus=pending`, adminToken);
    check("Filter by paymentStatus=pending → 200", r6.status === 200, `got ${r6.status}`);

    console.log("\n📋 Test 7: Pagination works");
    const r7 = await req("GET", `${BASE}/payments?page=1&limit=2`, adminToken);
    check("Pagination params accepted → 200", r7.status === 200, `got ${r7.status}`);
    check("Pagination limit respected", Array.isArray(r7.data?.data?.payments) && r7.data.data.payments.length <= 2);

    console.log("\n📋 Test 8: Get payment by ID");
    const r8 = await req("GET", `${BASE}/payments/${testPaymentId}`, adminToken);
    check("GET /payments/:id → 200", r8.status === 200, `got ${r8.status}`);
    check("Response has payment object", r8.data?.data?.payment?._id !== undefined);

    console.log("\n📋 Test 9: Invalid payment ID → 404");
    const r9 = await req("GET", `${BASE}/payments/000000000000000000000000`, adminToken);
    check("Non-existent payment ID → 404", r9.status === 404, `got ${r9.status}`);

    console.log("\n==================================================");
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);
    console.log("==================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Fatal verification error:", err);
    process.exit(1);
  } finally {
    if (testPaymentId) {
      await Payment.findByIdAndDelete(testPaymentId).catch(() => {});
    }
    if (testOrderId) {
      await Order.findByIdAndDelete(testOrderId).catch(() => {});
    }
    await Package.deleteMany({ name: "Payment Test Package" }).catch(() => {});
    await Game.deleteMany({ slug: "test-payment-game" }).catch(() => {});
    await Game.deleteMany({ name: "Payment Test Game" }).catch(() => {});
    await User.deleteMany({ email: { $in: [userEmail, adminEmail] } }).catch(() => {});
    if (listener) listener.close();
    await mongoose.disconnect();
    console.log("🧹 Cleanup done.");
  }
}

runVerification();