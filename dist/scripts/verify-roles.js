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
const user_model_1 = __importDefault(require("../models/user.model"));
const db_1 = __importDefault(require("../config/db"));
const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}`;
async function runVerification() {
    console.log("--------------------------------------------------");
    console.log("🚀 Starting Role Authorization Verification Tests");
    console.log("--------------------------------------------------");
    try {
        // 1. Connect to Database
        await (0, db_1.default)();
        console.log("✅ Connected to Database successfully.");
        // 2. Fetch or create regular and admin test users
        const userEmail = "test-user-verify@gamecoins.com";
        const adminEmail = "test-admin-verify@gamecoins.com";
        let testUser = await user_model_1.default.findOne({ email: userEmail });
        if (!testUser) {
            testUser = await user_model_1.default.create({
                name: "Test User",
                email: userEmail,
                password: "mocked_hashed_password",
                role: "user",
                isActive: true,
            });
        }
        let testAdmin = await user_model_1.default.findOne({ email: adminEmail });
        if (!testAdmin) {
            testAdmin = await user_model_1.default.create({
                name: "Test Admin",
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
        console.log("🔑 Generated verification JWT tokens successfully.");
        // Helper to request endpoint and return status and response body
        async function testRequest(token) {
            const headers = {
                "Content-Type": "application/json",
            };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
            const response = await fetch(`${API_URL}/api/games`, {
                method: "POST",
                headers,
                body: JSON.stringify({}), // Empty body to trigger verification flow
            });
            const text = await response.text();
            let body = {};
            try {
                body = JSON.parse(text);
            }
            catch {
                body = { raw: text };
            }
            return { status: response.status, body };
        }
        // Test Case 1: Request without token
        console.log("\n🧪 Test Case 1: Request POST /api/games (No Token)...");
        const res1 = await testRequest();
        console.log(`➡️ Response Status: ${res1.status}`);
        console.log(`➡️ Response Body:`, JSON.stringify(res1.body));
        if (res1.status === 401) {
            console.log("🟢 SUCCESS: Correctly rejected with 401 Unauthorized.");
        }
        else {
            console.log("🔴 FAILURE: Expected 401 Unauthorized.");
        }
        // Test Case 2: Request with user token
        console.log("\n🧪 Test Case 2: Request POST /api/games (User Role)...");
        const res2 = await testRequest(userToken);
        console.log(`➡️ Response Status: ${res2.status}`);
        console.log(`➡️ Response Body:`, JSON.stringify(res2.body));
        if (res2.status === 403) {
            console.log("🟢 SUCCESS: Correctly blocked with 403 Forbidden.");
        }
        else {
            console.log("🔴 FAILURE: Expected 403 Forbidden.");
        }
        // Test Case 3: Request with admin token
        console.log("\n🧪 Test Case 3: Request POST /api/games (Admin Role)...");
        const res3 = await testRequest(adminToken);
        console.log(`➡️ Response Status: ${res3.status}`);
        console.log(`➡️ Response Body:`, JSON.stringify(res3.body));
        // Since we sent an empty body ({}), the games controller validation will reject it with a 400 Bad Request,
        // which is the expected logic and proves it successfully passed authentication and role authorization checks!
        if (res3.status === 400 || res3.status === 201) {
            console.log("🟢 SUCCESS: Authorization passed (passed to controller validation flow).");
        }
        else {
            console.log(`🔴 FAILURE: Expected 400 validation error (got ${res3.status}).`);
        }
        console.log("\n--------------------------------------------------");
        console.log("🏁 Verification Tests Completed");
        console.log("--------------------------------------------------");
    }
    catch (error) {
        console.error("❌ Verification tests encountered an error:", error);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
runVerification();
//# sourceMappingURL=verify-roles.js.map