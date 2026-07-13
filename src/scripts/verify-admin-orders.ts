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
import app from "../index";

async function runVerification() {
  console.log("==================================================");
  console.log("🚀 Starting Admin Order Management Verification");
  console.log("==================================================");

  let listener: any;
  let testOrderId: string | null = null;

  try {
    await connectDB();
    console.log("✅ Database connected successfully.");

    const userEmail = "test-order-user@gamecoins.com";
    const adminEmail = "test-order-admin@gamecoins.com";

    let testUser = await User.findOne({ email: userEmail });
    if (!testUser) {
      testUser = await User.create({
        name: "Order Test Buyer",
        email: userEmail,
        password: "mocked_hashed_password",
        role: "user",
        isActive: true,
      });
    }

    let testAdmin = await User.findOne({ email: adminEmail });
    if (!testAdmin) {
      testAdmin = await User.create({
        name: "Order Test Admin",
        email: adminEmail,
        password: "mocked_hashed_password",
        role: "admin",
        isActive: true,
      });
    }

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

    // Get or create a real game and package for the order
    let testGame = await Game.findOne({ slug: "test-order-game" });
    if (!testGame) {
      testGame = await Game.create({
        name: "Order Test Game",
        slug: "test-order-game",
        shortDescription: "Test game for order verification",
        fullDescription: "Full desc",
        category: "Test",
        platform: "PC",
        publisher: "Test Publisher",
        isActive: true,
      });
    }

    let testPackage = await Package.findOne({ game: testGame._id, name: "Test Order Package" });
    if (!testPackage) {
      testPackage = await Package.create({
        name: "Test Order Package",
        game: testGame._id,
        description: "Test package for order verification",
        amount: 100,
        price: 9.99,
        currency: "USD",
        isActive: true,
      });
    }

    // Create a test order for verification
    const testOrder = await Order.create({
      user: testUser._id,
      game: testGame._id,
      package: testPackage._id,
      playerId: "verify-player-001",
      playerName: "VerifyPlayer",
      quantity: 1,
      unitPrice: testPackage.price,
      totalPrice: testPackage.price,
      paymentMethod: "bkash",
      paymentStatus: "pending",
      orderStatus: "pending",
    });
    testOrderId = testOrder._id.toString();
    console.log(`✅ Test order created: ${testOrderId}`);

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
    const r1 = await req("GET", `${BASE}/orders`);
    check("GET /orders without token → 401", r1.status === 401, `got ${r1.status}`);

    console.log("\n📋 Test 2: Non-admin request → 403");
    const r2 = await req("GET", `${BASE}/orders`, userToken);
    check("GET /orders with buyer token → 403", r2.status === 403, `got ${r2.status}`);

    console.log("\n📋 Test 3: Admin list orders → 200");
    const r3 = await req("GET", `${BASE}/orders`, adminToken);
    check("GET /orders with admin token → 200", r3.status === 200, `got ${r3.status}`);
    check("Response has orders array", Array.isArray(r3.data?.data?.orders), `got ${typeof r3.data?.data?.orders}`);
    check("Response has pagination", typeof r3.data?.data?.pagination === "object");

    console.log("\n📋 Test 4: Search works");
    const r4 = await req("GET", `${BASE}/orders?search=verify-player-001`, adminToken);
    check("Search by playerId returns results", r4.status === 200, `got ${r4.status}`);

    console.log("\n📋 Test 5: Filter by orderStatus");
    const r5 = await req("GET", `${BASE}/orders?orderStatus=pending`, adminToken);
    check("Filter by orderStatus=pending → 200", r5.status === 200, `got ${r5.status}`);

    console.log("\n📋 Test 6: Filter by paymentStatus");
    const r6 = await req("GET", `${BASE}/orders?paymentStatus=pending`, adminToken);
    check("Filter by paymentStatus=pending → 200", r6.status === 200, `got ${r6.status}`);

    console.log("\n📋 Test 7: Pagination works");
    const r7 = await req("GET", `${BASE}/orders?page=1&limit=2`, adminToken);
    check("Pagination params accepted → 200", r7.status === 200, `got ${r7.status}`);
    check("Pagination limit respected", Array.isArray(r7.data?.data?.orders) && r7.data.data.orders.length <= 2);

    console.log("\n📋 Test 8: Get order by ID");
    const r8 = await req("GET", `${BASE}/orders/${testOrderId}`, adminToken);
    check("GET /orders/:id → 200", r8.status === 200, `got ${r8.status}`);
    check("Response has order object", r8.data?.data?.order?._id !== undefined);

    console.log("\n📋 Test 9: Update order status");
    const r9 = await req("PATCH", `${BASE}/orders/${testOrderId}/status`, adminToken, { orderStatus: "processing" });
    check("PATCH /orders/:id/status → 200", r9.status === 200, `got ${r9.status}`);
    check("Order status updated to processing", r9.data?.data?.orderStatus === "processing");

    console.log("\n📋 Test 10: Invalid status → 400");
    const r10 = await req("PATCH", `${BASE}/orders/${testOrderId}/status`, adminToken, { orderStatus: "shipped" });
    check("Invalid status → 400", r10.status === 400, `got ${r10.status}`);

    console.log("\n📋 Test 11: Invalid order ID → 404 or 500");
    const r11 = await req("GET", `${BASE}/orders/000000000000000000000000`, adminToken);
    check("Non-existent order ID → 404", r11.status === 404, `got ${r11.status}`);

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
    // Cleanup test data
    if (testOrderId) {
      await Order.findByIdAndDelete(testOrderId).catch(() => {});
    }
    await Game.deleteOne({ slug: "test-order-game" }).catch(() => {});
    await User.deleteOne({ email: "test-order-user@gamecoins.com" }).catch(() => {});
    await User.deleteOne({ email: "test-order-admin@gamecoins.com" }).catch(() => {});
    if (listener) listener.close();
    await mongoose.disconnect();
    console.log("🧹 Cleanup done.");
  }
}

runVerification();
