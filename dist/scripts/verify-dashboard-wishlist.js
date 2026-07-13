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
const game_model_1 = __importDefault(require("../models/game.model"));
const wishlist_model_1 = __importDefault(require("../models/wishlist.model"));
const db_1 = __importDefault(require("../config/db"));
const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET;
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
async function main() {
    console.log("\n⭐️ Dashboard Wishlist Verification\n" + "=".repeat(50));
    await (0, db_1.default)();
    // Cleanup old test users
    await user_model_1.default.deleteMany({
        email: {
            $in: [
                "dashboard-wishlist-user-a@gamecoins.test",
                "dashboard-wishlist-user-b@gamecoins.test",
            ],
        },
    });
    // Create test users
    const userA = await user_model_1.default.create({
        name: "Wishlist User A",
        email: "dashboard-wishlist-user-a@gamecoins.test",
        password: "Test@123",
        role: "user",
    });
    const userB = await user_model_1.default.create({
        name: "Wishlist User B",
        email: "dashboard-wishlist-user-b@gamecoins.test",
        password: "Test@123",
        role: "user",
    });
    const tokenA = makeToken(userA._id.toString(), userA.email, "user");
    const tokenB = makeToken(userB._id.toString(), userB.email, "user");
    // Find or create two Games
    let game1 = await game_model_1.default.findOne({ slug: "free-fire-max" });
    if (!game1) {
        game1 = await game_model_1.default.create({
            name: "Free Fire MAX",
            slug: "free-fire-max",
            shortDescription: "Short desc",
            fullDescription: "Full desc",
            category: "Battle Royale",
            platform: "Mobile",
            publisher: "Garena",
            logo: "https://example.com/logo.png",
            banner: "https://example.com/banner.png",
            isActive: true,
        });
    }
    let game2 = await game_model_1.default.findOne({ slug: "pubg-mobile" });
    if (!game2) {
        game2 = await game_model_1.default.create({
            name: "PUBG Mobile",
            slug: "pubg-mobile",
            shortDescription: "Short desc",
            fullDescription: "Full desc",
            category: "Battle Royale",
            platform: "Mobile",
            publisher: "Tencent",
            logo: "https://example.com/logo.png",
            banner: "https://example.com/banner.png",
            isActive: true,
        });
    }
    // Ensure fresh start
    await wishlist_model_1.default.deleteMany({ user: { $in: [userA._id, userB._id] } });
    // Test 1: Request without token
    console.log("\n🧪 Test 1: Request wishlist without token...");
    const t1 = await req("GET", "/dashboard/wishlist");
    console.log(`➡️ Status: ${t1.status}`);
    if (t1.status === 401) {
        console.log("🟢 PASS: Unauthenticated access blocked correctly.");
    }
    else {
        console.error("🔴 FAIL: Expected 401 Unauthorized.");
        process.exit(1);
    }
    // Test 2: Get empty wishlist
    console.log("\n🧪 Test 2: Get empty wishlist...");
    const t2 = await req("GET", "/dashboard/wishlist", undefined, tokenA);
    console.log(`➡️ Status: ${t2.status}`);
    console.log("➡️ Data:", JSON.stringify(t2.data));
    if (t2.status === 200 &&
        t2.data?.success &&
        Array.isArray(t2.data?.data) &&
        t2.data?.data.length === 0 &&
        t2.data?.message === "No wishlist items found") {
        console.log("🟢 PASS: Correct empty wishlist response returned.");
    }
    else {
        console.error("🔴 FAIL: Expected 200 with empty wishlist.");
        process.exit(1);
    }
    // Test 3: Add game to wishlist
    console.log("\n🧪 Test 3: Add game to wishlist...");
    const t3 = await req("POST", "/dashboard/wishlist", { gameId: game1._id.toString() }, tokenA);
    console.log(`➡️ Status: ${t3.status}`);
    console.log("➡️ Data:", JSON.stringify(t3.data));
    if ((t3.status === 200 || t3.status === 201) &&
        t3.data?.success &&
        t3.data?.data?.game &&
        (t3.data?.data?.game === game1._id.toString() || t3.data?.data?.game?._id === game1._id.toString())) {
        console.log("🟢 PASS: Game successfully added to wishlist.");
    }
    else {
        console.error("🔴 FAIL: Failed to add game to wishlist.");
        process.exit(1);
    }
    // Test 4: Add same game again (duplicate check)
    console.log("\n🧪 Test 4: Add same game to wishlist again...");
    const t4 = await req("POST", "/dashboard/wishlist", { gameId: game1._id.toString() }, tokenA);
    console.log(`➡️ Status: ${t4.status}`);
    console.log("➡️ Data:", JSON.stringify(t4.data));
    if (t4.status === 400 && t4.data?.success === false && t4.data?.error === "Game already in wishlist") {
        console.log("🟢 PASS: Correctly blocked duplicate wishlist item.");
    }
    else {
        console.error("🔴 FAIL: Expected 400 with duplicate check.");
        process.exit(1);
    }
    // Test 7: User isolation (Add a payment/wishlist item for User B, verify it does not show up in User A's GET wishlist)
    console.log("\n🧪 Test 7: Seed wishlist item for User B & verify isolation...");
    const t7_add = await req("POST", "/dashboard/wishlist", { gameId: game2._id.toString() }, tokenB);
    if (t7_add.status !== 200 && t7_add.status !== 201) {
        console.error("🔴 FAIL: Failed to seed User B's wishlist.");
        process.exit(1);
    }
    // Test 5: Get wishlist for User A
    console.log("\n🧪 Test 5: Get populated wishlist and check isolation...");
    const t5 = await req("GET", "/dashboard/wishlist", undefined, tokenA);
    console.log(`➡️ Status: ${t5.status}`);
    console.log("➡️ Data:", JSON.stringify(t5.data));
    if (t5.status !== 200 || !t5.data?.success) {
        console.error("🔴 FAIL: Expected 200 OK with success.");
        process.exit(1);
    }
    const wishlistA = t5.data?.data;
    if (!Array.isArray(wishlistA) || wishlistA.length !== 1) {
        console.error(`🔴 FAIL: Expected exactly 1 wishlist item for User A, got ${wishlistA?.length}`);
        process.exit(1);
    }
    // Verify game populated
    const firstItem = wishlistA[0];
    if (firstItem.game && typeof firstItem.game === "object" && firstItem.game.name === game1.name) {
        console.log("🟢 PASS: Game schema details populated correctly.");
    }
    else {
        console.error("🔴 FAIL: Game schema details are not populated correctly.");
        process.exit(1);
    }
    // Verify isolation
    const containsUserBItem = wishlistA.some((item) => item.game?._id === game2._id.toString() || item.game === game2._id.toString());
    if (containsUserBItem) {
        console.error("🔴 FAIL: Security breach! User B's wishlist item returned in User A's wishlist.");
        process.exit(1);
    }
    else {
        console.log("🟢 PASS: Security isolation confirmed. User B's wishlist items are not returned.");
    }
    // Test 6: Remove wishlist item
    console.log("\n🧪 Test 6: Remove wishlist item...");
    const itemId = firstItem._id;
    const t6 = await req("DELETE", `/dashboard/wishlist/${itemId}`, undefined, tokenA);
    console.log(`➡️ Status: ${t6.status}`);
    console.log("➡️ Data:", JSON.stringify(t6.data));
    if (t6.status === 200 && t6.data?.success && t6.data?.message === "Removed from wishlist") {
        console.log("🟢 PASS: Wishlist item removed successfully.");
    }
    else {
        console.error("🔴 FAIL: Failed to remove wishlist item.");
        process.exit(1);
    }
    // Verify empty again
    const t6_check = await req("GET", "/dashboard/wishlist", undefined, tokenA);
    if (t6_check.data?.data?.length === 0) {
        console.log("🟢 PASS: Verified wishlist is empty after removal.");
    }
    else {
        console.error("🔴 FAIL: Wishlist not empty after removal.");
        process.exit(1);
    }
    // Clean up remaining test data
    const userBItems = await wishlist_model_1.default.find({ user: userB._id });
    for (const item of userBItems) {
        await wishlist_model_1.default.deleteOne({ _id: item._id });
    }
    await user_model_1.default.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    console.log("\n🧹 Cleaned up test database resources.");
    await mongoose_1.default.disconnect();
    console.log("=".repeat(50));
    console.log("🟢 ALL DASHBOARD WISHLIST TESTS PASSED!");
    console.log("=".repeat(50) + "\n");
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
//# sourceMappingURL=verify-dashboard-wishlist.js.map