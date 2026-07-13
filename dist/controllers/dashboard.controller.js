"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardOverview = getDashboardOverview;
exports.getBuyerOrders = getBuyerOrders;
exports.getBuyerOrderById = getBuyerOrderById;
exports.getBuyerPayments = getBuyerPayments;
exports.getBuyerWishlist = getBuyerWishlist;
exports.addToWishlist = addToWishlist;
exports.removeFromWishlist = removeFromWishlist;
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = __importDefault(require("../config/db"));
const apiResponse_1 = __importDefault(require("../utils/apiResponse"));
const errorHandler_1 = require("../middleware/errorHandler");
const order_model_1 = __importDefault(require("../models/order.model"));
const payment_model_1 = __importDefault(require("../models/payment.model"));
const game_model_1 = __importDefault(require("../models/game.model"));
const wishlist_model_1 = __importDefault(require("../models/wishlist.model"));
/**
 * GET /api/dashboard/overview
 * Returns dashboard summary metrics for the logged-in user.
 */
async function getDashboardOverview(req, res, next) {
    try {
        await (0, db_1.default)();
        const userId = req.user?.userId;
        if (!userId) {
            throw new errorHandler_1.ApiError("Unauthorized", 401);
        }
        const result = await order_model_1.default.aggregate([
            {
                $match: {
                    user: new mongoose_1.default.Types.ObjectId(userId),
                },
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSpent: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentStatus", "paid"] },
                                "$totalPrice",
                                0,
                            ],
                        },
                    },
                    pendingOrders: {
                        $sum: {
                            $cond: [
                                { $eq: ["$orderStatus", "pending"] },
                                1,
                                0,
                            ],
                        },
                    },
                    completedOrders: {
                        $sum: {
                            $cond: [
                                { $eq: ["$orderStatus", "completed"] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);
        const summary = result[0] || {
            totalOrders: 0,
            totalSpent: 0,
            pendingOrders: 0,
            completedOrders: 0,
        };
        // Remove _id from aggregation output if present
        const data = {
            totalOrders: summary.totalOrders,
            totalSpent: summary.totalSpent,
            pendingOrders: summary.pendingOrders,
            completedOrders: summary.completedOrders,
        };
        apiResponse_1.default.success(res, data, "Dashboard summary fetched successfully", 200);
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/dashboard/orders
 * Returns all orders belonging to the logged-in user.
 * Populates game and package details.
 * Sorted by newest first.
 */
async function getBuyerOrders(req, res, next) {
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
 * GET /api/dashboard/orders/:id
 * Returns a specific order details for the logged-in user if they own it.
 * Populates game and package details.
 */
async function getBuyerOrderById(req, res, next) {
    try {
        await (0, db_1.default)();
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errorHandler_1.ApiError("Unauthorized", 401);
        }
        if (typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new errorHandler_1.ApiError("Invalid order ID", 400);
        }
        const order = await order_model_1.default.findById(id)
            .populate("game")
            .populate("package");
        if (!order) {
            throw new errorHandler_1.ApiError("Order not found", 404);
        }
        // Verify ownership
        const orderUserId = typeof order.user === "object" && order.user !== null && "_id" in order.user
            ? order.user._id.toString()
            : order.user.toString();
        if (orderUserId !== userId) {
            throw new errorHandler_1.ApiError("Order not found", 404);
        }
        apiResponse_1.default.success(res, order, "Order fetched successfully", 200);
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/dashboard/payments
 * Returns all payments belonging to the logged-in user.
 * Populates order details, and nested game and package details.
 * Sorted by newest first.
 */
async function getBuyerPayments(req, res, next) {
    try {
        await (0, db_1.default)();
        const userId = req.user?.userId;
        if (!userId) {
            throw new errorHandler_1.ApiError("Unauthorized", 401);
        }
        const payments = await payment_model_1.default.find({ user: userId })
            .populate({
            path: "order",
            populate: [
                {
                    path: "game",
                },
                {
                    path: "package",
                },
            ],
        })
            .sort({ createdAt: -1 });
        if (payments.length === 0) {
            apiResponse_1.default.success(res, [], "No payments found", 200);
            return;
        }
        apiResponse_1.default.success(res, payments, "Payments fetched successfully", 200);
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/dashboard/wishlist
 * Returns wishlist items for the logged-in user.
 * Populates game details.
 * Sorted by newest first.
 */
async function getBuyerWishlist(req, res, next) {
    try {
        await (0, db_1.default)();
        const userId = req.user?.userId;
        if (!userId) {
            throw new errorHandler_1.ApiError("Unauthorized", 401);
        }
        const wishlist = await wishlist_model_1.default.find({ user: userId })
            .populate("game")
            .sort({ createdAt: -1 });
        if (wishlist.length === 0) {
            apiResponse_1.default.success(res, [], "No wishlist items found", 200);
            return;
        }
        apiResponse_1.default.success(res, wishlist, "Wishlist fetched successfully", 200);
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/dashboard/wishlist
 * Adds a game to the logged-in user's wishlist.
 */
async function addToWishlist(req, res, next) {
    try {
        await (0, db_1.default)();
        const userId = req.user?.userId;
        const { gameId } = req.body;
        if (!userId) {
            throw new errorHandler_1.ApiError("Unauthorized", 401);
        }
        if (!gameId || typeof gameId !== "string" || !mongoose_1.default.Types.ObjectId.isValid(gameId)) {
            throw new errorHandler_1.ApiError("Invalid game ID", 400);
        }
        const game = await game_model_1.default.findById(gameId);
        if (!game) {
            throw new errorHandler_1.ApiError("Game not found", 404);
        }
        // Check duplicate
        const existing = await wishlist_model_1.default.findOne({ user: userId, game: gameId });
        if (existing) {
            throw new errorHandler_1.ApiError("Game already in wishlist", 400);
        }
        const wishlistItem = await wishlist_model_1.default.create({
            user: userId,
            game: gameId,
        });
        apiResponse_1.default.success(res, wishlistItem, "Added to wishlist", 201);
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/dashboard/wishlist/:id
 * Removes a game from the logged-in user's wishlist.
 */
async function removeFromWishlist(req, res, next) {
    try {
        await (0, db_1.default)();
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) {
            throw new errorHandler_1.ApiError("Unauthorized", 401);
        }
        if (!id || typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new errorHandler_1.ApiError("Wishlist item not found", 404);
        }
        const wishlistItem = await wishlist_model_1.default.findById(id);
        if (!wishlistItem) {
            throw new errorHandler_1.ApiError("Wishlist item not found", 404);
        }
        const wishlistUserId = typeof wishlistItem.user === "object" && wishlistItem.user !== null && "_id" in wishlistItem.user
            ? wishlistItem.user._id.toString()
            : wishlistItem.user.toString();
        if (wishlistUserId !== userId) {
            throw new errorHandler_1.ApiError("Wishlist item not found", 404);
        }
        await wishlist_model_1.default.deleteOne({ _id: id });
        apiResponse_1.default.success(res, null, "Removed from wishlist", 200);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=dashboard.controller.js.map