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
const game_model_1 = __importDefault(require("../models/game.model"));
const index_1 = __importDefault(require("../index"));
async function runVerification() {
    console.log("==================================================");
    console.log("🚀 Starting Admin Product & Game Verification Tests");
    console.log("==================================================");
    let listener;
    try {
        await (0, db_1.default)();
        console.log("✅ Database connected successfully.");
        // Clean up past run test records if any exist
        await game_model_1.default.deleteMany({ slug: { $in: ["test-verify-game", "test-verify-game-updated"] } });
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
        // Generate JWT tokens
        const userToken = jsonwebtoken_1.default.sign({ userId: testUser._id.toString(), email: testUser.email, role: testUser.role }, jwtSecret, { expiresIn: "1h" });
        const adminToken = jsonwebtoken_1.default.sign({ userId: testAdmin._id.toString(), email: testAdmin.email, role: testAdmin.role }, jwtSecret, { expiresIn: "1h" });
        console.log("🔑 JWT tokens generated successfully.");
        // Dynamic Port Express Listener
        const server = index_1.default.listen(0);
        listener = server;
        const address = server.address();
        const port = typeof address === "string" ? 0 : address?.port;
        const API_URL = `http://localhost:${port}/api/dashboard/admin`;
        console.log(`📡 Temporary test server started on http://localhost:${port}`);
        // Helper request wrapper
        async function requestApi(path, method = "GET", token, body) {
            const headers = { "Content-Type": "application/json" };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
            const options = { method, headers };
            if (body) {
                options.body = JSON.stringify(body);
            }
            const res = await fetch(`${API_URL}${path}`, options);
            const status = res.status;
            let responseBody = {};
            try {
                const text = await res.text();
                responseBody = JSON.parse(text);
            }
            catch {
                responseBody = { error: "Failed to parse json response" };
            }
            return { status, body: responseBody };
        }
        let createdGameId = "";
        let createdPackageId = "";
        // 1. Auth check
        console.log("\n🧪 Test Case 1: Fetch games without authentication...");
        const res1 = await requestApi("/games");
        console.log(`➡️ Status: ${res1.status}, Body: ${JSON.stringify(res1.body)}`);
        if (res1.status === 401) {
            console.log("🟢 SUCCESS: Correctly rejected anonymous with 401.");
        }
        else {
            console.log(`🔴 FAILURE: Expected 401, got ${res1.status}`);
        }
        // 2. Role Auth check
        console.log("\n🧪 Test Case 2: Fetch games with standard User role...");
        const res2 = await requestApi("/games", "GET", userToken);
        console.log(`➡️ Status: ${res2.status}, Body: ${JSON.stringify(res2.body)}`);
        if (res2.status === 403) {
            console.log("🟢 SUCCESS: Correctly rejected standard user with 403.");
        }
        else {
            console.log(`🔴 FAILURE: Expected 403, got ${res2.status}`);
        }
        // 3. Create Game
        console.log("\n🧪 Test Case 3: Create Game as Admin...");
        const gamePayload = {
            name: "Test Verification Game",
            slug: "test-verify-game",
            shortDescription: "Short text for test game",
            fullDescription: "Full text for test game",
            category: "RPG",
            platform: "PC",
            publisher: "Verification Labs",
            logo: "http://logo.com",
            banner: "http://banner.com",
            rating: 4.5
        };
        const res3 = await requestApi("/games", "POST", adminToken, gamePayload);
        console.log(`➡️ Status: ${res3.status}`);
        if (res3.status === 201 && res3.body.success) {
            createdGameId = res3.body.data?._id;
            console.log("🟢 SUCCESS: Game created successfully.");
            console.log(`📊 Game ID: ${createdGameId}`);
        }
        else {
            console.log(`🔴 FAILURE: Create Game failed with status ${res3.status}. Body:`, res3.body);
        }
        // 4. Update Game
        console.log(`\n🧪 Test Case 4: Update Game Name & Slug...`);
        const updatePayload = {
            name: "Test Verification Game Updated",
            slug: "test-verify-game-updated"
        };
        const res4 = await requestApi(`/games/${createdGameId}`, "PATCH", adminToken, updatePayload);
        console.log(`➡️ Status: ${res4.status}`);
        if (res4.status === 200 && res4.body.success) {
            console.log("🟢 SUCCESS: Game updated successfully.");
            console.log(`📊 Updated Name: ${res4.body.data?.name}`);
        }
        else {
            console.log(`🔴 FAILURE: Update Game failed with status ${res4.status}`);
        }
        // 5. Create Package
        console.log("\n🧪 Test Case 5: Create Package under Game...");
        const pkgPayload = {
            game: createdGameId,
            name: "1000 Test Coins",
            amount: 1000,
            price: 15.00
        };
        const res5 = await requestApi("/packages", "POST", adminToken, pkgPayload);
        console.log(`➡️ Status: ${res5.status}`);
        if (res5.status === 201 && res5.body.success) {
            createdPackageId = res5.body.data?._id;
            console.log("🟢 SUCCESS: Package created successfully.");
            console.log(`   - Package ID: ${createdPackageId}`);
        }
        else {
            console.log(`🔴 FAILURE: Create Package failed with status ${res5.status}. Body:`, res5.body);
        }
        // 6. Update Package
        console.log(`\n🧪 Test Case 6: Update Package Price...`);
        const res6 = await requestApi(`/packages/${createdPackageId}`, "PATCH", adminToken, { price: 12.99 });
        console.log(`➡️ Status: ${res6.status}`);
        if (res6.status === 200 && res6.body.success) {
            console.log("🟢 SUCCESS: Package updated successfully.");
            console.log(`   - Updated Price: $${res6.body.data?.price}`);
        }
        else {
            console.log(`🔴 FAILURE: Update Package failed with status ${res6.status}`);
        }
        // 7. Search & Filter Games
        console.log("\n🧪 Test Case 7: Fetch games list with search (?search=updated)...");
        const res7 = await requestApi("/games?search=updated", "GET", adminToken);
        console.log(`➡️ Status: ${res7.status}`);
        if (res7.status === 200 && res7.body.success) {
            console.log(`🟢 SUCCESS: Retrieved games search list. Count: ${res7.body.data?.games?.length || 0}`);
        }
        else {
            console.log(`🔴 FAILURE: Games list fetch failed. Status ${res7.status}`);
        }
        // 8. Search & Filter Packages
        console.log(`\n🧪 Test Case 8: Fetch packages list with game filter (?game=${createdGameId})...`);
        const res8 = await requestApi(`/packages?game=${createdGameId}`, "GET", adminToken);
        console.log(`➡️ Status: ${res8.status}`);
        if (res8.status === 200 && res8.body.success) {
            console.log(`🟢 SUCCESS: Retrieved packages list. Count: ${res8.body.data?.packages?.length || 0}`);
        }
        else {
            console.log(`🔴 FAILURE: Packages list fetch failed. Status ${res8.status}`);
        }
        // 9. Delete Package
        console.log(`\n🧪 Test Case 9: Delete created package (${createdPackageId})...`);
        const res9 = await requestApi(`/packages/${createdPackageId}`, "DELETE", adminToken);
        console.log(`➡️ Status: ${res9.status}`);
        if (res9.status === 200 && res9.body.success) {
            console.log("🟢 SUCCESS: Package deleted successfully.");
        }
        else {
            console.log(`🔴 FAILURE: Delete package failed. Status ${res9.status}`);
        }
        // 10. Delete Game
        console.log(`\n🧪 Test Case 10: Delete created game (${createdGameId})...`);
        const res10 = await requestApi(`/games/${createdGameId}`, "DELETE", adminToken);
        console.log(`➡️ Status: ${res10.status}`);
        if (res10.status === 200 && res10.body.success) {
            console.log("🟢 SUCCESS: Game deleted successfully.");
        }
        else {
            console.log(`🔴 FAILURE: Delete game failed. Status ${res10.status}`);
        }
    }
    catch (err) {
        console.error("❌ Exception occurred during products/games verification:", err);
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
//# sourceMappingURL=verify-admin-products.js.map