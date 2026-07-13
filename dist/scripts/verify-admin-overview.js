"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_dns_1 = __importDefault(require("node:dns"));
node_dns_1.default.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const db_1 = __importDefault(require("../config/db"));
const user_model_1 = __importDefault(require("../models/user.model"));
const index_1 = __importDefault(require("../index"));
async function runVerification() {
    console.log("==================================================");
    console.log("🚀 Starting Admin Overview Verification Tests");
    console.log("==================================================");
    let listener;
    try {
        // 1. Connect to Database
        await (0, db_1.default)();
        console.log("✅ Database connected successfully.");
        // 2. Fetch or create test users
        const userEmail = "test-user-verify@gamecoins.com";
        const adminEmail = "test-admin-verify@gamecoins.com";
        let testUser = await user_model_1.default.findOne({ email: userEmail });
        if (!testUser) {
            testUser = await user_model_1.default.create({
                name: "Test Normal User",
                email: userEmail,
                password: "mocked_hashed_password",
                role: "user",
                isActive: true,
            });
        }
        let testAdmin = await user_model_1.default.findOne({ email: adminEmail });
        if (!testAdmin) {
            testAdmin = await user_model_1.default.create({
                name: "Test Admin User",
                email: adminEmail,
                password: "mocked_hashed_password",
                role: "admin",
                isActive: true,
            });
        }
        const jwtSecret = process.env.JWT_SECRET || "super_secret_gamecoins_key";
        // 3. Generate tokens
        const userToken = jsonwebtoken_1.default.sign({ userId: testUser._id.toString(), email: testUser.email, role: testUser.role }, jwtSecret, { expiresIn: "1h" });
        const adminToken = jsonwebtoken_1.default.sign({ userId: testAdmin._id.toString(), email: testAdmin.email, role: testAdmin.role }, jwtSecret, { expiresIn: "1h" });
        console.log("🔑 Generated user and admin JWT tokens successfully.");
        // 4. Start express server on a dynamic port
        const server = index_1.default.listen(0);
        listener = server;
        const address = server.address();
        const port = typeof address === "string" ? 0 : address?.port;
        const API_URL = `http://localhost:${port}`;
        console.log(`📡 Temporary test server started on ${API_URL}`);
        // Helper to query API overview route
        async function getOverview(token) {
            const headers = {};
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
            const res = await fetch(`${API_URL}/api/dashboard/admin/overview`, {
                method: "GET",
                headers,
            });
            const status = res.status;
            let body = {};
            try {
                const text = await res.text();
                body = JSON.parse(text);
            }
            catch (err) {
                body = { error: "Failed to parse JSON response" };
            }
            return { status, body };
        }
        // Test Case 1: Without Token
        console.log("\n🧪 Test Case 1: Fetching without Token...");
        const res1 = await getOverview();
        console.log(`➡️ Response Status: ${res1.status}`);
        console.log(`➡️ Response Body:`, JSON.stringify(res1.body));
        if (res1.status === 401) {
            console.log("🟢 SUCCESS: Correctly rejected request with 401 Unauthorized.");
        }
        else {
            console.log(`🔴 FAILURE: Expected status 401, but got ${res1.status}`);
        }
        // Test Case 2: Normal User Token
        console.log("\n🧪 Test Case 2: Fetching with Normal User Token...");
        const res2 = await getOverview(userToken);
        console.log(`➡️ Response Status: ${res2.status}`);
        console.log(`➡️ Response Body:`, JSON.stringify(res2.body));
        if (res2.status === 403) {
            console.log("🟢 SUCCESS: Correctly rejected request with 403 Forbidden.");
        }
        else {
            console.log(`🔴 FAILURE: Expected status 403, but got ${res2.status}`);
        }
        // Test Case 3: Admin Token
        console.log("\n🧪 Test Case 3: Fetching with Admin Token...");
        const res3 = await getOverview(adminToken);
        console.log(`➡️ Response Status: ${res3.status}`);
        if (res3.status === 200) {
            console.log("🟢 SUCCESS: Correctly authorized request with 200 OK.");
            const { success, data } = res3.body;
            if (success && data) {
                console.log("📊 Stats Returned:");
                console.log(`   - Total Users: ${data.totalUsers}`);
                console.log(`   - Total Sellers: ${data.totalSellers}`);
                console.log(`   - Total Orders: ${data.totalOrders}`);
                console.log(`   - Total Revenue: $${data.totalRevenue}`);
                console.log(`   - Recent Orders Count: ${data.recentOrders?.length || 0}`);
                if (data.recentOrders && data.recentOrders.length > 0) {
                    console.log("📝 Populated Fields Check on Recent Order:");
                    const firstOrder = data.recentOrders[0];
                    console.log(`   - User: ${firstOrder.user ? firstOrder.user.name : "MISSING"}`);
                    console.log(`   - Game: ${firstOrder.game ? firstOrder.game.name : "MISSING"}`);
                    console.log(`   - Package: ${firstOrder.package ? firstOrder.package.name : "MISSING"}`);
                }
            }
            else {
                console.log("🔴 FAILURE: Success flag or data node is missing in response body.");
            }
        }
        else {
            console.log(`🔴 FAILURE: Expected status 200, but got ${res3.status}`);
        }
    }
    catch (err) {
        console.error("❌ Exception occurred during verification:", err);
    }
    finally {
        if (listener) {
            listener.close();
            console.log("\n📡 Closed test server listener.");
        }
        await mongoose_1.default.connection.close();
        console.log("🔌 Closed database connection.");
        console.log("🏁 Verification process completed.");
    }
}
runVerification();
//# sourceMappingURL=verify-admin-overview.js.map