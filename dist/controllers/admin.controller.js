"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminOverview = getAdminOverview;
exports.getAllUsers = getAllUsers;
exports.getUserById = getUserById;
exports.updateUserRole = updateUserRole;
exports.updateUserStatus = updateUserStatus;
const db_1 = __importDefault(require("../config/db"));
const apiResponse_1 = __importDefault(require("../utils/apiResponse"));
const errorHandler_1 = require("../middleware/errorHandler");
const user_model_1 = __importDefault(require("../models/user.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const payment_model_1 = __importDefault(require("../models/payment.model"));
const wishlist_model_1 = __importDefault(require("../models/wishlist.model"));
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
/**
 * GET /api/dashboard/admin/users
 * Returns a paginated, searchable, sorted, and filtered list of users.
 */
async function getAllUsers(req, res, next) {
    try {
        await (0, db_1.default)();
        // Verify requesting user is admin
        if (!req.user || req.user.role !== "admin") {
            throw new errorHandler_1.ApiError("Forbidden: Admin access required", 403);
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = {};
        // Search by name or email
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, "i");
            query.$or = [{ name: searchRegex }, { email: searchRegex }];
        }
        // Role filtering
        if (req.query.role && req.query.role !== "all") {
            query.role = req.query.role;
        }
        // Status filtering
        if (req.query.status && req.query.status !== "all") {
            query.isActive = req.query.status === "active";
        }
        // Sorting mapping
        let sortOption = { createdAt: -1 }; // default newest
        if (req.query.sort === "oldest") {
            sortOption = { createdAt: 1 };
        }
        else if (req.query.sort === "name") {
            sortOption = { name: 1 };
        }
        const [users, total] = await Promise.all([
            user_model_1.default.find(query).sort(sortOption).skip(skip).limit(limit).select("-password"),
            user_model_1.default.countDocuments(query),
        ]);
        apiResponse_1.default.success(res, {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }, "Users list retrieved successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/dashboard/admin/users/:id
 * Returns single user details, recent orders/payments, and wishlist count.
 */
async function getUserById(req, res, next) {
    try {
        await (0, db_1.default)();
        // Verify requesting user is admin
        if (!req.user || req.user.role !== "admin") {
            throw new errorHandler_1.ApiError("Forbidden: Admin access required", 403);
        }
        const userId = req.params.id;
        const user = await user_model_1.default.findById(userId).select("-password");
        if (!user) {
            throw new errorHandler_1.ApiError("User not found", 404);
        }
        const [recentOrders, payments, wishlistCount] = await Promise.all([
            order_model_1.default.find({ user: userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("game", "name logo platform category")
                .populate("package", "name price"),
            payment_model_1.default.find({ user: userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("order", "totalPrice orderStatus"),
            wishlist_model_1.default.countDocuments({ user: userId }),
        ]);
        apiResponse_1.default.success(res, {
            user,
            recentOrders,
            payments,
            wishlistCount,
        }, "User details retrieved successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/dashboard/admin/users/:id/role
 * Updates a user's system role.
 */
async function updateUserRole(req, res, next) {
    try {
        await (0, db_1.default)();
        // Verify requesting user is admin
        if (!req.user || req.user.role !== "admin") {
            throw new errorHandler_1.ApiError("Forbidden: Admin access required", 403);
        }
        const userId = req.params.id;
        const { role } = req.body;
        const allowedRoles = ["user", "seller", "admin"];
        if (!role || !allowedRoles.includes(role)) {
            throw new errorHandler_1.ApiError("Invalid user role provided", 400);
        }
        // Prevent changing own role
        if (userId === req.user.userId) {
            throw new errorHandler_1.ApiError("Forbidden: Cannot change your own role", 400);
        }
        const user = await user_model_1.default.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");
        if (!user) {
            throw new errorHandler_1.ApiError("User not found", 404);
        }
        apiResponse_1.default.success(res, user, "User role updated successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/dashboard/admin/users/:id/status
 * Disables or enables a user account.
 */
async function updateUserStatus(req, res, next) {
    try {
        await (0, db_1.default)();
        // Verify requesting user is admin
        if (!req.user || req.user.role !== "admin") {
            throw new errorHandler_1.ApiError("Forbidden: Admin access required", 403);
        }
        const userId = req.params.id;
        const { isActive } = req.body;
        if (isActive === undefined || typeof isActive !== "boolean") {
            throw new errorHandler_1.ApiError("Invalid isActive status type", 400);
        }
        // Prevent disabling own account
        if (userId === req.user.userId) {
            throw new errorHandler_1.ApiError("Forbidden: Cannot disable your own account", 400);
        }
        const user = await user_model_1.default.findByIdAndUpdate(userId, { isActive }, { new: true }).select("-password");
        if (!user) {
            throw new errorHandler_1.ApiError("User not found", 404);
        }
        apiResponse_1.default.success(res, user, "User status updated successfully");
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=admin.controller.js.map