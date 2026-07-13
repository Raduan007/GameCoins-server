"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.getOrders = getOrders;
exports.getOrderById = getOrderById;
exports.cancelOrder = cancelOrder;
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = __importDefault(require("../config/db"));
const apiResponse_1 = __importDefault(require("../utils/apiResponse"));
const errorHandler_1 = require("../middleware/errorHandler");
const game_model_1 = __importDefault(require("../models/game.model"));
const package_model_1 = __importDefault(require("../models/package.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const REQUIRED_FIELDS = ["gameId", "packageId", "playerId", "paymentMethod"];
const ALLOWED_PAYMENT_METHODS = ["sslcommerz", "bkash", "nagad", "cod"];
/**
 * POST /api/orders
 * Creates a new order for a game package.
 */
async function createOrder(req, res, next) {
    try {
        await (0, db_1.default)();
        const { gameId, packageId, playerId, playerName, quantity, paymentMethod } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errorHandler_1.ApiError("Unauthorized", 401);
        }
        // 1. Validate required fields
        const missingFields = REQUIRED_FIELDS.filter((field) => {
            const value = req.body[field];
            return (value === undefined ||
                value === null ||
                (typeof value === "string" && value.trim() === ""));
        });
        if (missingFields.length > 0) {
            throw new errorHandler_1.ApiError(`Missing required fields: ${missingFields.join(", ")}`, 400);
        }
        // 2. Validate quantity
        const qty = quantity !== undefined ? Number(quantity) : 1;
        if (isNaN(qty) || qty < 1) {
            throw new errorHandler_1.ApiError("Quantity must be a number greater than or equal to 1", 400);
        }
        // 3. Validate paymentMethod
        if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
            throw new errorHandler_1.ApiError(`Invalid payment method. Must be one of: ${ALLOWED_PAYMENT_METHODS.join(", ")}`, 400);
        }
        // 4. Verify Game exists and is active
        const game = await game_model_1.default.findById(gameId).lean();
        if (!game || !game.isActive) {
            throw new errorHandler_1.ApiError("Game not found or inactive", 404);
        }
        // 5. Verify Package exists and is active
        const pkg = await package_model_1.default.findById(packageId).lean();
        if (!pkg || !pkg.isActive) {
            throw new errorHandler_1.ApiError("Package not found or inactive", 404);
        }
        // Verify package belongs to the game
        if (pkg.game.toString() !== gameId) {
            throw new errorHandler_1.ApiError("The selected package does not belong to this game", 400);
        }
        // 6. Calculate Pricing
        const totalPrice = pkg.price * qty;
        // 7. Save Order
        const order = await order_model_1.default.create({
            user: userId,
            game: gameId,
            package: packageId,
            playerId: playerId.trim(),
            playerName: playerName ? playerName.trim() : "",
            quantity: qty,
            unitPrice: pkg.price,
            totalPrice,
            paymentMethod,
            paymentStatus: "pending",
            orderStatus: "pending",
        });
        // 8. Return response
        apiResponse_1.default.success(res, order, "Order created successfully", 201);
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/orders
 * Fetches the order history for the logged-in user, sorted by newest first.
 * Populates game and package details.
 */
async function getOrders(req, res, next) {
    try {
        await (0, db_1.default)();
        const userId = req.user?.userId;
        if (!userId) {
            throw new errorHandler_1.ApiError("Unauthorized", 401);
        }
        const orders = await order_model_1.default.find({ user: userId })
            .populate("game")
            .populate("package")
            .sort({ createdAt: -1 });
        if (orders.length === 0) {
            apiResponse_1.default.success(res, [], "No orders found", 200);
            return;
        }
        apiResponse_1.default.success(res, orders, "Orders fetched successfully", 200);
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/orders/:id
 * Fetches details for a specific order.
 * Populates user (name, email), game, and package.
 * Restricts access to the order owner or an admin.
 */
async function getOrderById(req, res, next) {
    try {
        await (0, db_1.default)();
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            throw new errorHandler_1.ApiError("Unauthorized", 401);
        }
        // Validate ObjectId structure
        if (typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new errorHandler_1.ApiError("Order not found", 404);
        }
        const order = await order_model_1.default.findById(id)
            .populate("user", "name email")
            .populate("game")
            .populate("package");
        if (!order) {
            throw new errorHandler_1.ApiError("Order not found", 404);
        }
        // Check ownership or admin status
        const orderUserId = typeof order.user === "object" && order.user !== null && "_id" in order.user
            ? order.user._id.toString()
            : order.user.toString();
        if (orderUserId !== userId && userRole !== "admin") {
            throw new errorHandler_1.ApiError("Forbidden", 403);
        }
        apiResponse_1.default.success(res, order, "Order fetched successfully", 200);
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/orders/:id/cancel
 * Cancels a pending or processing order.
 * Enforces ownership or admin role authorization.
 */
async function cancelOrder(req, res, next) {
    try {
        await (0, db_1.default)();
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            throw new errorHandler_1.ApiError("Unauthorized", 401);
        }
        // Validate ObjectId structure
        if (typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new errorHandler_1.ApiError("Order not found", 404);
        }
        const order = await order_model_1.default.findById(id);
        if (!order) {
            throw new errorHandler_1.ApiError("Order not found", 404);
        }
        // Check ownership or admin status
        const orderUserId = typeof order.user === "object" && order.user !== null && "_id" in order.user
            ? order.user._id.toString()
            : order.user.toString();
        if (orderUserId !== userId && userRole !== "admin") {
            throw new errorHandler_1.ApiError("Forbidden", 403);
        }
        // Validation rules
        if (order.orderStatus === "cancelled") {
            throw new errorHandler_1.ApiError("Order is already cancelled", 400);
        }
        if (order.orderStatus === "completed") {
            throw new errorHandler_1.ApiError("Completed orders cannot be cancelled", 400);
        }
        // Cancellation
        order.orderStatus = "cancelled";
        await order.save();
        apiResponse_1.default.success(res, order, "Order cancelled successfully", 200);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=order.controller.js.map