"use strict";
/**
 * Verification script: PATCH /api/payments/:id/status
 *
 * Tests:
 *  1. No token           → 401 Unauthorized
 *  2. Normal user token  → 403 Forbidden
 *  3. Invalid status     → 400 Invalid payment status
 *  4. Admin pays order   → 200, payment.paymentStatus === "paid",
 *                          order.orderStatus === "completed", order.paymentStatus === "paid"
 *  5. Wrong payment ID   → 404 Payment not found
 */
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
const game_model_1 = __importDefault(require("../models/game.model"));
const package_model_1 = __importDefault(require("../models/package.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const payment_model_1 = __importDefault(require("../models/payment.model"));
const db_1 = __importDefault(require("../config/db"));
const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET;
// ─── helpers ────────────────────────────────────────────────────────────────
function makeToken(userId, email, role) {
    return jsonwebtoken_1.default.sign({ userId, email, role }, JWT_SECRET, { expiresIn: "1h" });
}
async function req(method, path, body, token) {
    const headers = { "Content-Type": "application/json" };
    if (token)
        headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}
// ─── seed data ──────────────────────────────────────────────────────────────
async function seed() {
    await (0, db_1.default)();
    // clean up previous runs
    await user_model_1.default.deleteMany({ email: { $in: ["verify-pss-user@gamecoins.test", "verify-pss-admin@gamecoins.test"] } });
    const normalUser = await user_model_1.default.create({
        name: "PSS Normal",
        email: "verify-pss-user@gamecoins.test",
        password: "Test@123",
        role: "user",
    });
    const adminUser = await user_model_1.default.create({
        name: "PSS Admin",
        email: "verify-pss-admin@gamecoins.test",
        password: "Admin@123",
        role: "admin",
    });
    // Reuse any active game/package
    let game = await game_model_1.default.findOne({ isActive: true });
    if (!game)
        throw new Error("No active game found. Please seed at least one game.");
    let pkg = await package_model_1.default.findOne({ game: game._id, isActive: true });
    if (!pkg)
        throw new Error("No active package found for this game.");
    // Create a fresh order owned by the normal user
    const order = await order_model_1.default.create({
        user: normalUser._id,
        game: game._id,
        package: pkg._id,
        playerId: "pss-player-001",
        playerName: "PSS Player",
        quantity: 1,
        unitPrice: pkg.price,
        totalPrice: pkg.price,
        paymentMethod: "bkash",
        paymentStatus: "pending",
        orderStatus: "pending",
    });
    // Create a payment for that order
    const payment = await payment_model_1.default.create({
        user: normalUser._id,
        order: order._id,
        amount: order.totalPrice,
        paymentMethod: "bkash",
        paymentStatus: "pending",
    });
    return {
        normalUser,
        adminUser,
        order,
        payment,
        normalToken: makeToken(normalUser._id.toString(), normalUser.email, "user"),
        adminToken: makeToken(adminUser._id.toString(), adminUser.email, "admin"),
    };
}
async function cleanup(normalEmail, adminEmail, paymentId, orderId) {
    await payment_model_1.default.deleteOne({ _id: paymentId });
    await order_model_1.default.deleteOne({ _id: orderId });
    await user_model_1.default.deleteMany({ email: { $in: [normalEmail, adminEmail] } });
}
// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
    console.log("\n🔧 Payment Status Sync Verification\n" + "=".repeat(50));
    let seeded = null;
    let passed = 0;
    let failed = 0;
    function pass(msg) {
        console.log(`🟢 PASS: ${msg}`);
        passed++;
    }
    function fail(msg, detail) {
        console.log(`🔴 FAIL: ${msg}`);
        if (detail !== undefined)
            console.log("   Detail:", JSON.stringify(detail, null, 2));
        failed++;
    }
    try {
        seeded = await seed();
        const { payment, order, normalToken, adminToken } = seeded;
        const paymentId = payment._id.toString();
        const fakeId = "000000000000000000000000";
        // ── Test 1: No token → 401 ────────────────────────────────────────────
        console.log("\n🧪 Test 1: No token → 401 Unauthorized");
        const t1 = await req("PATCH", `/payments/${paymentId}/status`, { paymentStatus: "paid" });
        console.log(`   ➡️  Status: ${t1.status}`);
        if (t1.status === 401) {
            pass("Correctly rejected unauthenticated request.");
        }
        else {
            fail(`Expected 401, got ${t1.status}`, t1.data);
        }
        // ── Test 2: Normal user token → 403 ──────────────────────────────────
        console.log("\n🧪 Test 2: Normal user token → 403 Forbidden");
        const t2 = await req("PATCH", `/payments/${paymentId}/status`, { paymentStatus: "paid" }, normalToken);
        console.log(`   ➡️  Status: ${t2.status}`);
        if (t2.status === 403) {
            pass("Correctly blocked non-admin user.");
        }
        else {
            fail(`Expected 403, got ${t2.status}`, t2.data);
        }
        // ── Test 3: Invalid paymentStatus → 400 ──────────────────────────────
        console.log("\n🧪 Test 3: Invalid paymentStatus → 400");
        const t3 = await req("PATCH", `/payments/${paymentId}/status`, { paymentStatus: "wrong" }, adminToken);
        console.log(`   ➡️  Status: ${t3.status}`);
        if (t3.status === 400) {
            pass(`Correctly rejected invalid status. Error: "${t3.data?.error}"`);
        }
        else {
            fail(`Expected 400, got ${t3.status}`, t3.data);
        }
        // ── Test 4: Admin updates to "paid" → 200 + order sync ────────────────
        console.log("\n🧪 Test 4: Admin updates paymentStatus to 'paid' → 200 + order sync");
        const t4 = await req("PATCH", `/payments/${paymentId}/status`, { paymentStatus: "paid" }, adminToken);
        console.log(`   ➡️  Status: ${t4.status}`);
        if (t4.status !== 200) {
            fail(`Expected 200, got ${t4.status}`, t4.data);
        }
        else {
            const paymentOk = t4.data?.data?.paymentStatus === "paid";
            if (paymentOk) {
                pass(`payment.paymentStatus === "paid" ✅`);
            }
            else {
                fail(`payment.paymentStatus should be "paid" but got "${t4.data?.data?.paymentStatus}"`);
            }
            // Verify order was synced in DB
            const updatedOrder = await order_model_1.default.findById(order._id);
            const orderStatusOk = updatedOrder?.orderStatus === "completed";
            const orderPaymentOk = updatedOrder?.paymentStatus === "paid";
            if (orderStatusOk) {
                pass(`order.orderStatus === "completed" ✅`);
            }
            else {
                fail(`order.orderStatus should be "completed" but got "${updatedOrder?.orderStatus}"`);
            }
            if (orderPaymentOk) {
                pass(`order.paymentStatus === "paid" ✅`);
            }
            else {
                fail(`order.paymentStatus should be "paid" but got "${updatedOrder?.paymentStatus}"`);
            }
        }
        // ── Test 5: Wrong payment ID → 404 ────────────────────────────────────
        console.log("\n🧪 Test 5: Wrong payment ID → 404 Payment not found");
        const t5 = await req("PATCH", `/payments/${fakeId}/status`, { paymentStatus: "paid" }, adminToken);
        console.log(`   ➡️  Status: ${t5.status}`);
        if (t5.status === 404) {
            pass(`Correctly returned 404 for non-existent payment.`);
        }
        else {
            fail(`Expected 404, got ${t5.status}`, t5.data);
        }
    }
    catch (err) {
        console.error("\n❌ Fatal error during verification:", err.message);
    }
    finally {
        if (seeded) {
            await cleanup(seeded.normalUser.email, seeded.adminUser.email, seeded.payment._id.toString(), seeded.order._id.toString());
            console.log("\n🧹 Cleaned up test data.");
        }
        await mongoose_1.default.disconnect();
        console.log("\n" + "=".repeat(50));
        console.log(`✅ Passed: ${passed}  |  ❌ Failed: ${failed}`);
        console.log("=".repeat(50) + "\n");
        process.exit(failed > 0 ? 1 : 0);
    }
}
main();
//# sourceMappingURL=verify-payment-status-sync.js.map