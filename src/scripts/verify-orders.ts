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

const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}`;

async function runOrderVerification() {
  console.log("--------------------------------------------------");
  console.log("🚀 Starting Create Order API Verification Tests");
  console.log("--------------------------------------------------");

  try {
    await connectDB();
    console.log("✅ Connected to Database successfully.");

    // 1. Setup test user
    const userEmail = "test-user-verify-order@gamecoins.com";
    let testUser = await User.findOne({ email: userEmail });
    if (!testUser) {
      testUser = await User.create({
        name: "Test Order Buyer",
        email: userEmail,
        password: "mocked_hashed_password",
        role: "user",
        isActive: true,
      });
    }

    const jwtSecret = process.env.JWT_SECRET || "super_secret_gamecoins_key";
    const userToken = jwt.sign(
      { userId: testUser._id.toString(), email: testUser.email, role: testUser.role },
      jwtSecret,
      { expiresIn: "1h" }
    );
    console.log("🔑 Generated user JWT token.");

    // 2. Setup active game
    let testGame = await Game.findOne({ name: "Order Test Game" });
    if (!testGame) {
      testGame = await Game.create({
        name: "Order Test Game",
        slug: "order-test-game",
        shortDescription: "A game for testing orders",
        fullDescription: "Long description for testing orders",
        category: "Action",
        platform: "PC",
        publisher: "GameCoins Test Lab",
        logo: "http://logo.com/img.png",
        banner: "http://logo.com/banner.png",
        isActive: true,
      });
    }

    // 3. Setup active package
    let testPackage = await Package.findOne({ name: "1000 Coins Package" });
    if (!testPackage) {
      testPackage = await Package.create({
        game: testGame._id,
        name: "1000 Coins Package",
        amount: 1000,
        price: 9.99, // 9.99 USD
        currency: "USD",
        description: "Standard coins package",
        isPopular: true,
        isActive: true,
      });
    }

    // Helper request fetcher
    async function sendCreateOrderRequest(body: any, token?: string) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/orders`, {
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
    console.log("\n🧪 Test Case 1: Create Order without token (unauthenticated)...");
    const res1 = await sendCreateOrderRequest({
      gameId: testGame._id.toString(),
      packageId: testPackage._id.toString(),
      playerId: "player123",
      paymentMethod: "bkash",
      quantity: 2,
    });
    console.log(`➡️ Status: ${res1.status}, Error:`, res1.body.error);
    if (res1.status === 401) {
      console.log("🟢 SUCCESS: Correctly blocked unauthenticated request.");
    } else {
      console.log("🔴 FAILURE: Expected status 401.");
    }

    // Test 2: Invalid Game ID (404)
    console.log("\n🧪 Test Case 2: Create Order with non-existent Game ID...");
    const res2 = await sendCreateOrderRequest(
      {
        gameId: new mongoose.Types.ObjectId().toString(),
        packageId: testPackage._id.toString(),
        playerId: "player123",
        paymentMethod: "bkash",
        quantity: 2,
      },
      userToken
    );
    console.log(`➡️ Status: ${res2.status}, Error:`, res2.body.error);
    if (res2.status === 404) {
      console.log("🟢 SUCCESS: Correctly returned 404 for missing game.");
    } else {
      console.log("🔴 FAILURE: Expected status 404.");
    }

    // Test 3: Successful Order Creation (201)
    console.log("\n🧪 Test Case 3: Create Order successfully (Quantity = 3)...");
    const quantityToTest = 3;
    const res3 = await sendCreateOrderRequest(
      {
        gameId: testGame._id.toString(),
        packageId: testPackage._id.toString(),
        playerId: "player12345",
        playerName: "Alex Mercer",
        paymentMethod: "bkash",
        quantity: quantityToTest,
      },
      userToken
    );
    console.log(`➡️ Status: ${res3.status}`);
    console.log(`➡️ Body:`, JSON.stringify(res3.body));

    if (res3.status === 201 && res3.body.success) {
      console.log("🟢 SUCCESS: Order created successfully.");
      const order = res3.body.data;
      const expectedTotalPrice = testPackage.price * quantityToTest;
      if (order.totalPrice === expectedTotalPrice) {
        console.log(`🟢 SUCCESS: Pricing calculation correct (${testPackage.price} * ${quantityToTest} = ${order.totalPrice}).`);
      } else {
        console.log(`🔴 FAILURE: Expected total price ${expectedTotalPrice}, but got ${order.totalPrice}.`);
      }

      // Cleanup created test order
      await Order.deleteOne({ _id: order._id });
      console.log("🧹 Cleaned up verification test order from DB.");
    } else {
      console.log("🔴 FAILURE: Order creation failed.");
    }

    console.log("\n--------------------------------------------------");
    console.log("🏁 Verification Tests Completed");
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("❌ Verification tests encountered an error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

runOrderVerification();
