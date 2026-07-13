"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_dns_1 = __importDefault(require("node:dns"));
node_dns_1.default.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
require("dotenv/config");
const db_1 = __importDefault(require("../config/db"));
const user_model_1 = __importDefault(require("../models/user.model"));
const index_1 = __importDefault(require("../index"));
async function runVerification() {
    console.log("==================================================");
    console.log("🚀 Starting Admin Profile & Settings Verification");
    console.log("==================================================");
    let listener;
    let testUserId = null;
    let testAdminId = null;
    const userEmail = "test-profile-user@gamecoins.com";
    const adminEmail = "test-profile-admin@gamecoins.com";
    const originalPassword = "admin_secure_pass_123";
    try {
        await (0, db_1.default)();
        console.log("✅ Database connected successfully.");
        // Clean up stale users
        await user_model_1.default.deleteMany({ email: { $in: [userEmail, adminEmail] } }).catch(() => { });
        // Create test buyer
        let testUser = await user_model_1.default.create({
            name: "Profile Test Buyer",
            email: userEmail,
            password: await bcrypt_1.default.hash("buyer_password_123", 10),
            role: "user",
            isActive: true,
        });
        testUserId = testUser._id.toString();
        // Create test admin
        let testAdmin = await user_model_1.default.create({
            name: "Profile Test Admin",
            email: adminEmail,
            password: await bcrypt_1.default.hash(originalPassword, 10),
            role: "admin",
            isActive: true,
        });
        testAdminId = testAdmin._id.toString();
        const jwtSecret = process.env.JWT_SECRET || "super_secret_gamecoins_key";
        const userToken = jsonwebtoken_1.default.sign({ userId: testUserId, email: testUser.email, role: testUser.role }, jwtSecret, { expiresIn: "1h" });
        const adminToken = jsonwebtoken_1.default.sign({ userId: testAdminId, email: testAdmin.email, role: testAdmin.role }, jwtSecret, { expiresIn: "1h" });
        listener = index_1.default.listen(0);
        const port = listener.address().port;
        const BASE = `http://127.0.0.1:${port}/api/dashboard/admin`;
        async function req(method, url, token, body) {
            const opts = {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                ...(body ? { body: JSON.stringify(body) } : {}),
            };
            const res = await fetch(url, opts);
            let data = null;
            try {
                data = await res.json();
            }
            catch { }
            return { status: res.status, data };
        }
        let passed = 0;
        let failed = 0;
        function check(label, condition, detail) {
            if (condition) {
                console.log(`  ✅ PASS: ${label}`);
                passed++;
            }
            else {
                console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
                failed++;
            }
        }
        console.log("\n📋 Test 1: Unauthorized request returns 401");
        const r1 = await req("GET", `${BASE}/profile`);
        check("GET /profile without token → 401", r1.status === 401, `got ${r1.status}`);
        console.log("\n📋 Test 2: Buyer request returns 403");
        const r2 = await req("GET", `${BASE}/profile`, userToken);
        check("GET /profile with buyer token → 403", r2.status === 403, `got ${r2.status}`);
        console.log("\n📋 Test 3: Admin profile loads");
        const r3 = await req("GET", `${BASE}/profile`, adminToken);
        check("GET /profile with admin token → 200", r3.status === 200, `got ${r3.status}`);
        check("Response has admin name", r3.data?.data?.name === "Profile Test Admin", `got ${r3.data?.data?.name}`);
        check("Response has admin email", r3.data?.data?.email === adminEmail, `got ${r3.data?.data?.email}`);
        check("Response has admin role", r3.data?.data?.role === "admin", `got ${r3.data?.data?.role}`);
        check("Response lacks password", r3.data?.data?.password === undefined);
        console.log("\n📋 Test 4: Update profile works");
        const r4 = await req("PATCH", `${BASE}/profile`, adminToken, {
            name: "Updated Admin Name",
            avatar: "https://placehold.co/128x128.png",
        });
        check("PATCH /profile → 200", r4.status === 200, `got ${r4.status}`);
        check("Name was updated", r4.data?.data?.name === "Updated Admin Name", `got ${r4.data?.data?.name}`);
        check("Avatar was updated", r4.data?.data?.avatar === "https://placehold.co/128x128.png", `got ${r4.data?.data?.avatar}`);
        console.log("\n📋 Test 5: Update profile prevents illegal updates");
        const r5 = await req("PATCH", `${BASE}/profile`, adminToken, {
            role: "user",
            email: "hacker@gmail.com",
        });
        // The controller ignores these fields since they are not mapped
        const checkUser = await user_model_1.default.findById(testAdminId).lean();
        check("Role remains admin", checkUser?.role === "admin", `got ${checkUser?.role}`);
        check("Email remains unchanged", checkUser?.email === adminEmail, `got ${checkUser?.email}`);
        console.log("\n📋 Test 6: Invalid update inputs rejected");
        const r6 = await req("PATCH", `${BASE}/profile`, adminToken, {
            name: "",
        });
        check("Empty name returns 400", r6.status === 400, `got ${r6.status}`);
        console.log("\n📋 Test 7: Wrong current password rejected");
        const r7 = await req("PATCH", `${BASE}/profile/password`, adminToken, {
            currentPassword: "wrong_password",
            newPassword: "new_secure_password_123",
            confirmPassword: "new_secure_password_123",
        });
        check("Wrong current password → 400", r7.status === 400, `got ${r7.status}`);
        console.log("\n📋 Test 8: Invalid password rejected");
        const r8_1 = await req("PATCH", `${BASE}/profile/password`, adminToken, {
            currentPassword: originalPassword,
            newPassword: "short",
            confirmPassword: "short",
        });
        check("Short password (<8 chars) → 400", r8_1.status === 400, `got ${r8_1.status}`);
        const r8_2 = await req("PATCH", `${BASE}/profile/password`, adminToken, {
            currentPassword: originalPassword,
            newPassword: "new_secure_password_123",
            confirmPassword: "different_confirm_123",
        });
        check("Unmatched confirm password → 400", r8_2.status === 400, `got ${r8_2.status}`);
        console.log("\n📋 Test 9: Password change succeeds");
        const r9 = await req("PATCH", `${BASE}/profile/password`, adminToken, {
            currentPassword: originalPassword,
            newPassword: "new_secure_password_123",
            confirmPassword: "new_secure_password_123",
        });
        check("PATCH /profile/password → 200", r9.status === 200, `got ${r9.status}`);
        // Verify new password works by trying to login or manually checking hashes
        const checkPass = await user_model_1.default.findById(testAdminId);
        const isNewMatch = await bcrypt_1.default.compare("new_secure_password_123", checkPass?.password || "");
        check("New password hashed and matches", isNewMatch === true);
        console.log("\n==================================================");
        console.log(`📊 Results: ${passed} passed, ${failed} failed`);
        console.log("==================================================");
        if (failed > 0) {
            process.exit(1);
        }
    }
    catch (err) {
        console.error("❌ Fatal verification error:", err);
        process.exit(1);
    }
    finally {
        if (testUserId) {
            await user_model_1.default.findByIdAndDelete(testUserId).catch(() => { });
        }
        if (testAdminId) {
            await user_model_1.default.findByIdAndDelete(testAdminId).catch(() => { });
        }
        if (listener)
            listener.close();
        await mongoose_1.default.disconnect();
        console.log("🧹 Cleanup done.");
    }
}
runVerification();
//# sourceMappingURL=verify-admin-profile.js.map