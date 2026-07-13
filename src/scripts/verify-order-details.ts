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

async function runOrderDetailsVerification() {
  console.log("--------------------------------------------------");
  console.log("🚀 Starting Order Details API Verification Tests");
  console.log("--------------------------------------------------");

  try {
    await connectDB();
    console.log("✅ Connected to Database successfully.");

    // 1. Setup test users
    const userEmail = "test-user-details@gamecoins.com";
    const adminEmail = "test-admin-details@gamecoins.com";
    const otherUserEmail = "test-other-details@gamecoins.com";

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
    const admin = await setupUser(adminEmail, "admin", "Admin User");
    const other = await setupUser(otherUserEmail, "user", "Other User");

    const jwtSecret = process.env.JWT_SECRET || "super_secret_gamecoins_key";
    
    const tokenBuyer = jwt.sign({ userId: buyer._id.toString(), email: buyer.email, role: buyer.role }, jwtSecret, { expiresIn: "1h" });
    const tokenAdmin = jwt.sign({ userId: admin._id.toString(), email: admin.email, role: admin.role }, jwtSecret, { expiresIn: "1h" });
    const tokenOther = jwt.sign({ userId: other._id.toString(), email: other.email, role: other.role }, jwtSecret, { expiresIn: "1h" });

    // 2. Setup game and package
    let testGame = await Game.findOne({ name: "Details Test Game" });
    if (!testGame) {
      testGame = await Game.create({
        name: "Details Test Game",
        slug: "details-test-game",
        shortDescription: "A game for testing details",
        fullDescription: "Long description for testing details",
        category: "Action",
        platform: "PC",
        publisher: "GameCoins Test Lab",
        logo: "http://logo.com/img.png",
        banner: "http://logo.com/banner.png",
        isActive: true,
      });
    }

    let testPackage = await Package.findOne({ name: "250 Coins Package" });
    if (!testPackage) {
      testPackage = await Package.create({
        game: testGame._id,
        name: "250 Coins Package",
        amount: 250,
        price: 2.99,
        currency: "USD",
        description: "Details coins package",
        isPopular: true,
        isActive: true,
      });
    }

    // 3. Create an order for buyer
    const testOrder = await Order.create({
      user: buyer._id,
      game: testGame._id,
      package: testPackage._id,
      playerId: "player111",
      playerName: "Buyer One",
      quantity: 2,
      unitPrice: 2.99,
      totalPrice: 5.98,
      paymentMethod: "bkash",
      paymentStatus: "pending",
      orderStatus: "pending",
    });
    console.log(`📦 Created verification test order with ID: ${testOrder._id}`);

    // Helper request fetcher
    async function getOrderDetailsRequest(orderId: string, token?: string) {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
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

    // Test 1: Unauthenticated request
    console.log("\n🧪 Test Case 1: Get Order Details without token (unauthenticated)...");
    const res1 = await getOrderDetailsRequest(testOrder._id.toString());
    console.log(`➡️ Status: ${res1.status}, Error:`, res1.body.error);
    if (res1.status === 401) {
      console.log("🟢 SUCCESS: Correctly blocked unauthenticated request.");
    } else {
      console.log("🔴 FAILURE: Expected status 401.");
    }

    // Test 2: Fetch by owner (buyer)
    console.log("\n🧪 Test Case 2: Get Order Details by owner (buyer)...");
    const res2 = await getOrderDetailsRequest(testOrder._id.toString(), tokenBuyer);
    console.log(`➡️ Status: ${res2.status}`);
    if (res2.status === 200 && res2.body.success) {
      console.log("🟢 SUCCESS: Owner successfully fetched the order details.");
      console.log(`🔍 Populated user: Name="${res2.body.data.user?.name}", Email="${res2.body.data.user?.email}"`);
      if (res2.body.data.user?.name && res2.body.data.user?.email) {
        console.log("🟢 SUCCESS: User document populated successfully.");
      } else {
        console.log("🔴 FAILURE: Failed to populate user name and email.");
      }
    } else {
      console.log("🔴 FAILURE: Owner failed to fetch details.");
    }

    // Test 3: Fetch by admin
    console.log("\n🧪 Test Case 3: Get Order Details by admin (non-owner)...");
    const res3 = await getOrderDetailsRequest(testOrder._id.toString(), tokenAdmin);
    console.log(`➡️ Status: ${res3.status}`);
    if (res3.status === 200 && res3.body.success) {
      console.log("🟢 SUCCESS: Admin successfully fetched non-owned order details.");
    } else {
      console.log("🔴 FAILURE: Admin failed to fetch details.");
    }

    // Test 4: Fetch by other user (non-owner, non-admin)
    console.log("\n🧪 Test Case 4: Get Order Details by another user (non-owner)...");
    const res4 = await getOrderDetailsRequest(testOrder._id.toString(), tokenOther);
    console.log(`➡️ Status: ${res4.status}, Error:`, res4.body.error);
    if (res4.status === 403) {
      console.log("🟢 SUCCESS: Correctly blocked non-owner, non-admin access.");
    } else {
      console.log("🔴 FAILURE: Expected status 403.");
    }

    // Test 5: Fetch non-existent order ID
    console.log("\n🧪 Test Case 5: Get Order Details for non-existent order ID...");
    const res5 = await getOrderDetailsRequest(new mongoose.Types.ObjectId().toString(), tokenBuyer);
    console.log(`➡️ Status: ${res5.status}, Error:`, res5.body.error);
    if (res5.status === 404) {
      console.log("🟢 SUCCESS: Correctly returned 404 for missing order ID.");
    } else {
      console.log("🔴 FAILURE: Expected status 404.");
    }

    // Cleanup
    await Order.deleteOne({ _id: testOrder._id });
    console.log("\n🧹 Cleaned up details test order from database.");

    console.log("\n--------------------------------------------------");
    console.log("🏁 Verification Tests Completed");
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("❌ Verification tests encountered an error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

runOrderDetailsVerification();
