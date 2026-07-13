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

async function runOrderHistoryVerification() {
  console.log("--------------------------------------------------");
  console.log("🚀 Starting Order History API Verification Tests");
  console.log("--------------------------------------------------");

  try {
    await connectDB();
    console.log("✅ Connected to Database successfully.");

    // 1. Setup test user
    const userEmail = "test-user-history@gamecoins.com";
    let testUser = await User.findOne({ email: userEmail });
    if (!testUser) {
      testUser = await User.create({
        name: "Test History Buyer",
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

    // Ensure we start with no orders for this test user
    await Order.deleteMany({ user: testUser._id });

    // Helper request fetchers
    async function getOrdersRequest(token?: string) {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "GET",
        headers,
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

    async function createOrderRequest(body: any, token: string) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      return response.json();
    }

    // Setup active game and package
    let testGame = await Game.findOne({ name: "History Test Game" });
    if (!testGame) {
      testGame = await Game.create({
        name: "History Test Game",
        slug: "history-test-game",
        shortDescription: "A game for testing history",
        fullDescription: "Long description for testing history",
        category: "Action",
        platform: "PC",
        publisher: "GameCoins Test Lab",
        logo: "http://logo.com/img.png",
        banner: "http://logo.com/banner.png",
        isActive: true,
      });
    }

    let testPackage = await Package.findOne({ name: "500 Coins Package" });
    if (!testPackage) {
      testPackage = await Package.create({
        game: testGame._id,
        name: "500 Coins Package",
        amount: 500,
        price: 4.99,
        currency: "USD",
        description: "History coins package",
        isPopular: true,
        isActive: true,
      });
    }

    // Test Case 1: Unauthenticated request
    console.log("\n🧪 Test Case 1: Get Order History without token (unauthenticated)...");
    const res1 = await getOrdersRequest();
    console.log(`➡️ Status: ${res1.status}, Error:`, res1.body.error);
    if (res1.status === 401) {
      console.log("🟢 SUCCESS: Correctly blocked unauthenticated request.");
    } else {
      console.log("🔴 FAILURE: Expected status 401.");
    }

    // Test Case 2: Fetch history with no orders
    console.log("\n🧪 Test Case 2: Get Order History with zero orders...");
    const res2 = await getOrdersRequest(userToken);
    console.log(`➡️ Status: ${res2.status}`);
    console.log(`➡️ Body Message: "${res2.body.message}"`);
    console.log(`➡️ Body Data Length: ${res2.body.data.length}`);
    if (res2.status === 200 && res2.body.success && res2.body.data.length === 0 && res2.body.message === "No orders found") {
      console.log("🟢 SUCCESS: Correctly returned empty history response.");
    } else {
      console.log("🔴 FAILURE: Expected success response with no orders.");
    }

    // Test Case 3: Create orders and verify history population & sorting
    console.log("\n🧪 Test Case 3: Create 2 orders and fetch history...");
    console.log("Creating first order...");
    const order1 = await createOrderRequest({
      gameId: testGame._id.toString(),
      packageId: testPackage._id.toString(),
      playerId: "playerA",
      paymentMethod: "bkash",
      quantity: 1,
    }, userToken);

    console.log("Waiting 1s before creating the second order to ensure distinct timestamps...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Creating second order...");
    const order2 = await createOrderRequest({
      gameId: testGame._id.toString(),
      packageId: testPackage._id.toString(),
      playerId: "playerB",
      paymentMethod: "nagad",
      quantity: 5,
    }, userToken);

    console.log("Fetching order history...");
    const res3 = await getOrdersRequest(userToken);
    console.log(`➡️ Status: ${res3.status}`);
    console.log(`➡️ Body Message: "${res3.body.message}"`);
    console.log(`➡️ Body Data Length: ${res3.body.data.length}`);

    if (res3.status === 200 && res3.body.data.length === 2) {
      console.log("🟢 SUCCESS: Correctly returned both created orders.");
      
      const orders = res3.body.data;
      console.log("\n🔍 Checking population:");
      console.log(`Order 1 populated game name: "${orders[0].game?.name}"`);
      console.log(`Order 1 populated package name: "${orders[0].package?.name}"`);
      if (orders[0].game?.name && orders[0].package?.name) {
        console.log("🟢 SUCCESS: Game and Package populated correctly.");
      } else {
        console.log("🔴 FAILURE: Failed to populate game/package details.");
      }

      console.log("\n🔍 Checking newest-first sorting:");
      console.log(`First returned order playerId: "${orders[0].playerId}" (should be playerB)`);
      console.log(`Second returned order playerId: "${orders[1].playerId}" (should be playerA)`);
      if (orders[0].playerId === "playerB" && orders[1].playerId === "playerA") {
        console.log("🟢 SUCCESS: Orders are correctly sorted by newest first.");
      } else {
        console.log("🔴 FAILURE: Orders are not sorted by newest first.");
      }
    } else {
      console.log("🔴 FAILURE: Failed to fetch populated history details.");
    }

    // Cleanup created orders
    await Order.deleteMany({ user: testUser._id });
    console.log("\n🧹 Cleaned up test history orders from database.");

    console.log("\n--------------------------------------------------");
    console.log("🏁 Verification Tests Completed");
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("❌ Verification tests encountered an error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

runOrderHistoryVerification();
