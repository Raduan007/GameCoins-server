import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import "dotenv/config";
import connectDB from "../config/db";
import User from "../models/user.model";
import app from "../index";

async function runVerification() {
  console.log("==================================================");
  console.log("🚀 Starting Admin User Management Verification Tests");
  console.log("==================================================");

  let listener: any;
  try {
    await connectDB();
    console.log("✅ Database connected successfully.");

    const userEmail = "test-user-verify@gamecoins.com";
    const adminEmail = "test-admin-verify@gamecoins.com";
    const targetEmail = "test-target-user@gamecoins.com";

    // Ensure test user accounts exist
    let testUser = await User.findOne({ email: userEmail });
    if (!testUser) {
      testUser = await User.create({
        name: "Test Normal User",
        email: userEmail,
        password: "mocked_hashed_password",
        role: "user",
        isActive: true,
      });
    }

    let testAdmin = await User.findOne({ email: adminEmail });
    if (!testAdmin) {
      testAdmin = await User.create({
        name: "Test Admin User",
        email: adminEmail,
        password: "mocked_hashed_password",
        role: "admin",
        isActive: true,
      });
    }

    let targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) {
      targetUser = await User.create({
        name: "Target User For Update",
        email: targetEmail,
        password: "mocked_hashed_password",
        role: "user",
        isActive: true,
      });
    }

    const jwtSecret = process.env.JWT_SECRET || "super_secret_gamecoins_key";

    // Generate JWT tokens
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

    console.log("🔑 JWT tokens generated successfully.");

    // Start Express listener on dynamic port
    const server = app.listen(0);
    listener = server;
    const address = server.address();
    const port = typeof address === "string" ? 0 : address?.port;
    const API_URL = `http://localhost:${port}/api/dashboard/admin/users`;
    console.log(`📡 Temporary test server started on http://localhost:${port}`);

    // Helper request wrapper
    async function requestApi(path: string, method: string = "GET", token?: string, body?: any) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const options: any = { method, headers };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const res = await fetch(`${API_URL}${path}`, options);
      const status = res.status;
      let responseBody: any = {};
      try {
        const text = await res.text();
        responseBody = JSON.parse(text);
      } catch {
        responseBody = { error: "Failed to parse json response" };
      }
      return { status, body: responseBody };
    }

    // 1. Anonymous test
    console.log("\n🧪 Test Case 1: Fetch users list without Token (Anonymous)...");
    const res1 = await requestApi("");
    console.log(`➡️ Status: ${res1.status}, Body: ${JSON.stringify(res1.body)}`);
    if (res1.status === 401) {
      console.log("🟢 SUCCESS: Correctly rejected anonymous with 401 Unauthorized.");
    } else {
      console.log(`🔴 FAILURE: Expected 401, got ${res1.status}`);
    }

    // 2. Standard user token test
    console.log("\n🧪 Test Case 2: Fetch users list with Normal User Token...");
    const res2 = await requestApi("", "GET", userToken);
    console.log(`➡️ Status: ${res2.status}, Body: ${JSON.stringify(res2.body)}`);
    if (res2.status === 403) {
      console.log("🟢 SUCCESS: Correctly rejected standard user with 403 Forbidden.");
    } else {
      console.log(`🔴 FAILURE: Expected 403, got ${res2.status}`);
    }

    // 3. Admin token test (Users list)
    console.log("\n🧪 Test Case 3: Fetch users list with Admin Token...");
    const res3 = await requestApi("", "GET", adminToken);
    console.log(`➡️ Status: ${res3.status}`);
    if (res3.status === 200 && res3.body.success) {
      console.log("🟢 SUCCESS: Correctly loaded users list.");
      console.log(`📊 Users Count returned: ${res3.body.data?.users?.length || 0}`);
      console.log(`📊 Pagination total: ${res3.body.data?.pagination?.total || 0}`);
    } else {
      console.log(`🔴 FAILURE: Expected 200 with success status, got ${res3.status}`);
    }

    // 4. Search and pagination parameters test
    console.log("\n🧪 Test Case 4: Search query filter (?search=target)...");
    const res4 = await requestApi("?search=target", "GET", adminToken);
    console.log(`➡️ Status: ${res4.status}`);
    if (res4.status === 200 && res4.body.success) {
      const filtered = res4.body.data?.users || [];
      console.log(`🟢 SUCCESS: Filter search works. Users containing 'target': ${filtered.length}`);
      if (filtered.length > 0) {
        console.log(`   - Sample User: ${filtered[0].name} (${filtered[0].email})`);
      }
    } else {
      console.log(`🔴 FAILURE: Query filter error. Got status ${res4.status}`);
    }

    // 5. Single user details populate test
    console.log(`\n🧪 Test Case 5: Fetch single user by ID (${targetUser._id.toString()})...`);
    const res5 = await requestApi(`/${targetUser._id.toString()}`, "GET", adminToken);
    console.log(`➡️ Status: ${res5.status}`);
    if (res5.status === 200 && res5.body.success) {
      console.log("🟢 SUCCESS: Retrieved single user details successfully.");
      const details = res5.body.data;
      console.log(`   - User: ${details.user?.name}`);
      console.log(`   - Recent Orders Count: ${details.recentOrders?.length || 0}`);
      console.log(`   - Recent Payments Count: ${details.payments?.length || 0}`);
      console.log(`   - Wishlist count: ${details.wishlistCount}`);
    } else {
      console.log(`🔴 FAILURE: Failed loading user profile by ID. Got status ${res5.status}`);
    }

    // 6. Update user role test
    console.log(`\n🧪 Test Case 6: Update user role to 'seller'...`);
    const res6 = await requestApi(`/${targetUser._id.toString()}/role`, "PATCH", adminToken, { role: "seller" });
    console.log(`➡️ Status: ${res6.status}, Body: ${JSON.stringify(res6.body)}`);
    if (res6.status === 200 && res6.body.success) {
      console.log("🟢 SUCCESS: Target user role updated to seller successfully.");
    } else {
      console.log(`🔴 FAILURE: Role update failed. Got status ${res6.status}`);
    }

    // 7. Update user status toggle
    console.log(`\n🧪 Test Case 7: Toggle user status (isActive = false)...`);
    const res7 = await requestApi(`/${targetUser._id.toString()}/status`, "PATCH", adminToken, { isActive: false });
    console.log(`➡️ Status: ${res7.status}, Body: ${JSON.stringify(res7.body)}`);
    if (res7.status === 200 && res7.body.success) {
      console.log("🟢 SUCCESS: Target user active status toggled to false successfully.");
    } else {
      console.log(`🔴 FAILURE: Active status update failed. Got status ${res7.status}`);
    }

    // 8. Self protection checks (Demoting own role)
    console.log("\n🧪 Test Case 8: Attempt to update own role...");
    const res8 = await requestApi(`/${testAdmin._id.toString()}/role`, "PATCH", adminToken, { role: "user" });
    console.log(`➡️ Status: ${res8.status}, Body: ${JSON.stringify(res8.body)}`);
    if (res8.status === 400) {
      console.log("🟢 SUCCESS: Correctly blocked admin from demoting own role.");
    } else {
      console.log(`🔴 FAILURE: Expected 400 Bad Request, got status ${res8.status}`);
    }

    // 9. Self protection checks (Disabling own active state)
    console.log("\n🧪 Test Case 9: Attempt to disable own account...");
    const res9 = await requestApi(`/${testAdmin._id.toString()}/status`, "PATCH", adminToken, { isActive: false });
    console.log(`➡️ Status: ${res9.status}, Body: ${JSON.stringify(res9.body)}`);
    if (res9.status === 400) {
      console.log("🟢 SUCCESS: Correctly blocked admin from disabling own account.");
    } else {
      console.log(`🔴 FAILURE: Expected 400 Bad Request, got status ${res9.status}`);
    }

  } catch (err) {
    console.error("❌ Exception during user management verification tests:", err);
  } finally {
    if (listener) {
      listener.close();
      console.log("\n📡 Closed test server listener.");
    }
    await mongoose.connection.close();
    console.log("🔌 Closed database connection.");
    console.log("🏁 Verification process completed.");
  }
}

runVerification();
