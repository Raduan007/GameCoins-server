"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardOverview = getDashboardOverview;
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = __importDefault(require("../config/db"));
const apiResponse_1 = __importDefault(require("../utils/apiResponse"));
const errorHandler_1 = require("../middleware/errorHandler");
const order_model_1 = __importDefault(require("../models/order.model"));
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
//# sourceMappingURL=dashboard.controller.js.map