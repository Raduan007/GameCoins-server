"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminOverview = getAdminOverview;
const db_1 = __importDefault(require("../config/db"));
const apiResponse_1 = __importDefault(require("../utils/apiResponse"));
const errorHandler_1 = require("../middleware/errorHandler");
const user_model_1 = __importDefault(require("../models/user.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
/**
 * GET /api/dashboard/admin/overview
 * Returns admin dashboard summary statistics and recent orders.
 */
async function getAdminOverview(req, res, next) {
    try {
        await (0, db_1.default)();
        // Verify requesting user is admin
        if (!req.user || req.user.role !== "admin") {
            throw new errorHandler_1.ApiError("Forbidden: Admin access required", 403);
        }
        // Gather dashboard statistics
        const [totalUsers, totalSellers, totalOrders, revenueResult] = await Promise.all([
            user_model_1.default.countDocuments(),
            user_model_1.default.countDocuments({ role: "seller" }),
            order_model_1.default.countDocuments(),
            order_model_1.default.aggregate([
                {
                    $match: {
                        paymentStatus: "paid",
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$totalPrice" },
                    },
                },
            ]),
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;
        // Fetch 5 most recent orders with populated fields
        const recentOrders = await order_model_1.default.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("user", "name email role avatar")
            .populate("game", "name logo platform category")
            .populate("package", "name price");
        apiResponse_1.default.success(res, {
            totalUsers,
            totalSellers,
            totalOrders,
            totalRevenue,
            recentOrders,
        }, "Admin overview statistics fetched successfully");
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=admin.controller.js.map