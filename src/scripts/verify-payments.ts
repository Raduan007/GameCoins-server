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

const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}`;

async function runPaymentVerification() {
  console.log("--------------------------------------------------");
  console.log("🚀 Starting Create Payment API Verification Tests");
  console.log("--------------------------------------------------");

  try {
    await connectDB();
    console.log("✅ Connected to Database successfully.");

    // 1. Setup test users
    const userEmail = "test-user-payment@gamecoins.com";
    const otherEmail = "test-other-payment@gamecoins.com";

    const setupUser = async (email: string, role: "user" | "admin", name: string) => {
      let u = await User.findOne({ email });
      if (!u) {
        u = await User.create({
          name,
          email,
          password: "mocked_hashed_password",
          role,
          isActive: true,
        });
      }
      return u;
    };

    const buyer = await setupUser(userEmail, "user", "Buyer User");
    const other = await setupUser(otherEmail, "user", "Other User");

    const jwtSecret = process.env.JWT_SECRET || "super_secret_gamecoins_key";
    
    const tokenBuyer = jwt.sign({ userId: buyer._id.toString(), email: buyer.email, role: buyer.role }, jwtSecret, { expiresIn: "1h" });
    const tokenOther = jwt.sign({ userId: other._id.toString(), email: other.email, role: other.role }, jwtSecret, { expiresIn: "1h" });

    // 2. Setup game and package
    let testGame = await Game.findOne({ name: "Payment Test Game" });
    if (!testGame) {
      testGame = await Game.create({
        name: "Payment Test Game",
        slug: "payment-test-game",
        shortDescription: "A game for testing payments",
        fullDescription: "Long description for testing payments",
        category: "Action",
        platform: "PC",
        publisher: "GameCoins Test Lab",
        logo: "http://logo.com/img.png",
        banner: "http://logo.com/banner.png",
        isActive: true,
      });
    }

    let testPackage = await Package.findOne({ name: "150 Coins Package" });
    if (!testPackage) {
      testPackage = await Package.create({
        game: testGame._id,
        name: "150 Coins Package",
        amount: 150,
        price: 1.50,
        currency: "USD",
        description: "Payment coins package",
        isPopular: true,
        isActive: true,
      });
    }

    // 3. Create test order for buyer
    const testOrder = await Order.create({
      user: buyer._id,
      game: testGame._id,
      package: testPackage._id,
      playerId: "player333",
      playerName: "Buyer Payment Test",
      quantity: 10,
      unitPrice: 1.50,
      totalPrice: 15.00, // 1.50 * 10
      paymentMethod: "bkash",
      paymentStatus: "pending",
      orderStatus: "pending",
    });
    console.log(`📦 Created verification test order with ID: ${testOrder._id}`);

    // Clean any prior payments for this order
    await Payment.deleteMany({ order: testOrder._id });

    // Helper request fetcher
    async function sendCreatePaymentRequest(body: any, token?: string) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const text = await response.text();
      let resBody: any = {};
      try {
        resBody = JSON.parse(text);
      } catch {
        resBody = { raw: text };
      }

      return { status: response.status, body: resBody };
    }

    // Test 1: Unauthenticated request
    console.log("\n🧪 Test Case 1: Create payment without token (unauthenticated)...");
    const res1 = await sendCreatePaymentRequest({ orderId: testOrder._id.toString(), paymentMethod: "bkash" });
    console.log(`➡️ Status: ${res1.status}, Error:`, res1.body.error);
    if (res1.status === 401) {
      console.log("🟢 SUCCESS: Correctly blocked unauthenticated request.");
    } else {
      console.log("🔴 FAILURE: Expected status 401.");
    }

    // Test 2: Other user request (Forbidden)
    console.log("\n🧪 Test Case 2: Create payment with another user token (non-owner)...");
    const res2 = await sendCreatePaymentRequest({ orderId: testOrder._id.toString(), paymentMethod: "bkash" }, tokenOther);
    console.log(`➡️ Status: ${res2.status}, Error:`, res2.body.error);
    if (res2.status === 403) {
      console.log("🟢 SUCCESS: Correctly blocked non-owner request.");
    } else {
      console.log("🔴 FAILURE: Expected status 403.");
    }

    // Test 3: Owner request with invalid paymentMethod (400)
    console.log("\n🧪 Test Case 3: Create payment with invalid payment method...");
    const res3 = await sendCreatePaymentRequest({ orderId: testOrder._id.toString(), paymentMethod: "invalid_method" }, tokenBuyer);
    console.log(`➡️ Status: ${res3.status}, Error:`, res3.body.error);
    if (res3.status === 400 && res3.body.error?.includes("Invalid payment method")) {
      console.log("🟢 SUCCESS: Correctly rejected invalid payment method.");
    } else {
      console.log("🔴 FAILURE: Expected status 400 with 'Invalid payment method' error.");
    }

    // Test 4: Successful payment creation
    console.log("\n🧪 Test Case 4: Successful payment creation by owner...");
    const res4 = await sendCreatePaymentRequest({ orderId: testOrder._id.toString(), paymentMethod: "bkash" }, tokenBuyer);
    console.log(`➡️ Status: ${res4.status}`);
    console.log(`➡️ Body:`, JSON.stringify(res4.body));

    if (res4.status === 201 && res4.body.success) {
      console.log("🟢 SUCCESS: Payment record created successfully.");
      const payment = res4.body.data;
      if (payment.amount === testOrder.totalPrice) {
        console.log(`🟢 SUCCESS: Payment amount matches order totalPrice (${payment.amount} = ${testOrder.totalPrice}).`);
      } else {
        console.log(`🔴 FAILURE: Expected payment amount ${testOrder.totalPrice}, but got ${payment.amount}.`);
      }

      // Test 5: Attempt to create duplicate payment
      console.log("\n🧪 Test Case 5: Attempt to create duplicate payment for the same order...");
      const res5 = await sendCreatePaymentRequest({ orderId: testOrder._id.toString(), paymentMethod: "nagad" }, tokenBuyer);
      console.log(`➡️ Status: ${res5.status}, Error:`, res5.body.error);
      if (res5.status === 400 && res5.body.error?.includes("Payment already exists")) {
        console.log("🟢 SUCCESS: Correctly blocked duplicate payment creation.");
      } else {
        console.log("🔴 FAILURE: Expected duplicate check block status 400.");
      }

      // Cleanup
      await Payment.deleteOne({ _id: payment._id });
      console.log("\n🧹 Cleaned up details test payment from database.");
    } else {
      console.log("🔴 FAILURE: Owner failed to create payment.");
    }

    // Cleanup order
    await Order.deleteOne({ _id: testOrder._id });
    console.log("🧹 Cleaned up details test order from database.");

    console.log("\n--------------------------------------------------");
    console.log("🏁 Verification Tests Completed");
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("❌ Verification tests encountered an error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

runPaymentVerification();
