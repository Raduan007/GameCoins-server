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
exports.getAdminGames = getAdminGames;
exports.getAdminGameById = getAdminGameById;
exports.createAdminGame = createAdminGame;
exports.updateAdminGame = updateAdminGame;
exports.deleteAdminGame = deleteAdminGame;
exports.getAdminPackages = getAdminPackages;
exports.getAdminPackageById = getAdminPackageById;
exports.createAdminPackage = createAdminPackage;
exports.updateAdminPackage = updateAdminPackage;
exports.deleteAdminPackage = deleteAdminPackage;
exports.getAdminOrders = getAdminOrders;
exports.getAdminOrderById = getAdminOrderById;
exports.updateAdminOrderStatus = updateAdminOrderStatus;
exports.getAdminPayments = getAdminPayments;
exports.getAdminPaymentById = getAdminPaymentById;
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = __importDefault(require("../config/db"));
const apiResponse_1 = __importDefault(require("../utils/apiResponse"));
const errorHandler_1 = require("../middleware/errorHandler");
const user_model_1 = __importDefault(require("../models/user.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const payment_model_1 = __importDefault(require("../models/payment.model"));
const wishlist_model_1 = __importDefault(require("../models/wishlist.model"));
const game_model_1 = __importDefault(require("../models/game.model"));
const package_model_1 = __importDefault(require("../models/package.model"));
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
/* ==========================================================================
   ADMIN GAMES MANAGEMENT
   ========================================================================== */
/**
 * GET /api/dashboard/admin/games
 * Returns a paginated, filtered list of games.
 */
async function getAdminGames(req, res, next) {
    try {
        await (0, db_1.default)();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = {};
        if (req.query.search) {
            query.name = new RegExp(req.query.search, "i");
        }
        if (req.query.isActive !== undefined && req.query.isActive !== "all") {
            query.isActive = req.query.isActive === "true";
        }
        if (req.query.isPopular !== undefined && req.query.isPopular !== "all") {
            query.isPopular = req.query.isPopular === "true";
        }
        if (req.query.isFeatured !== undefined && req.query.isFeatured !== "all") {
            query.isFeatured = req.query.isFeatured === "true";
        }
        let sortOption = { createdAt: -1 };
        if (req.query.sort === "oldest")
            sortOption = { createdAt: 1 };
        if (req.query.sort === "name")
            sortOption = { name: 1 };
        if (req.query.sort === "rating")
            sortOption = { rating: -1 };
        const [games, total] = await Promise.all([
            game_model_1.default.find(query).sort(sortOption).skip(skip).limit(limit),
            game_model_1.default.countDocuments(query),
        ]);
        apiResponse_1.default.success(res, {
            games,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }, "Games retrieved successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/dashboard/admin/games/:id
 */
async function getAdminGameById(req, res, next) {
    try {
        await (0, db_1.default)();
        const game = await game_model_1.default.findById(req.params.id);
        if (!game) {
            throw new errorHandler_1.ApiError("Game not found", 404);
        }
        apiResponse_1.default.success(res, game, "Game details retrieved successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/dashboard/admin/games
 */
async function createAdminGame(req, res, next) {
    try {
        await (0, db_1.default)();
        const { name, slug, shortDescription, fullDescription, category, platform, publisher, logo, banner, rating, isPopular, isFeatured, isActive, } = req.body;
        if (!name || !name.trim()) {
            throw new errorHandler_1.ApiError("Game name is required", 400);
        }
        if (!slug || !slug.trim()) {
            throw new errorHandler_1.ApiError("Game slug is required", 400);
        }
        // Rating check
        const numRating = rating !== undefined ? Number(rating) : 0;
        if (numRating < 0 || numRating > 5) {
            throw new errorHandler_1.ApiError("Rating must be between 0 and 5", 400);
        }
        // Check duplicate name
        const dupName = await game_model_1.default.findOne({ name: name.trim() });
        if (dupName) {
            throw new errorHandler_1.ApiError("A game with this name already exists", 400);
        }
        // Check duplicate slug
        const dupSlug = await game_model_1.default.findOne({ slug: slug.trim().toLowerCase() });
        if (dupSlug) {
            throw new errorHandler_1.ApiError("A game with this slug already exists", 400);
        }
        const game = await game_model_1.default.create({
            name: name.trim(),
            slug: slug.trim().toLowerCase(),
            shortDescription: shortDescription ? shortDescription.trim() : "",
            fullDescription: fullDescription ? fullDescription.trim() : "",
            category: category ? category.trim() : "",
            platform: platform ? platform.trim() : "",
            publisher: publisher ? publisher.trim() : "",
            logo: logo ? logo.trim() : "",
            banner: banner ? banner.trim() : "",
            rating: numRating,
            isPopular: isPopular !== undefined ? Boolean(isPopular) : false,
            isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
        });
        apiResponse_1.default.success(res, game, "Game created successfully", 201);
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/dashboard/admin/games/:id
 */
async function updateAdminGame(req, res, next) {
    try {
        await (0, db_1.default)();
        const gameId = req.params.id;
        const body = req.body || {};
        const game = await game_model_1.default.findById(gameId);
        if (!game) {
            throw new errorHandler_1.ApiError("Game not found", 404);
        }
        if (body.name && body.name.trim() !== game.name) {
            const dupName = await game_model_1.default.findOne({ name: body.name.trim(), _id: { $ne: gameId } });
            if (dupName)
                throw new errorHandler_1.ApiError("A game with this name already exists", 400);
        }
        if (body.slug && body.slug.trim().toLowerCase() !== game.slug) {
            const dupSlug = await game_model_1.default.findOne({ slug: body.slug.trim().toLowerCase(), _id: { $ne: gameId } });
            if (dupSlug)
                throw new errorHandler_1.ApiError("A game with this slug already exists", 400);
        }
        if (body.rating !== undefined) {
            const numRating = Number(body.rating);
            if (numRating < 0 || numRating > 5) {
                throw new errorHandler_1.ApiError("Rating must be between 0 and 5", 400);
            }
        }
        const updated = await game_model_1.default.findByIdAndUpdate(gameId, body, { new: true, runValidators: true });
        apiResponse_1.default.success(res, updated, "Game updated successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/dashboard/admin/games/:id
 */
async function deleteAdminGame(req, res, next) {
    try {
        await (0, db_1.default)();
        const game = await game_model_1.default.findByIdAndDelete(req.params.id);
        if (!game) {
            throw new errorHandler_1.ApiError("Game not found", 404);
        }
        apiResponse_1.default.success(res, null, "Game deleted successfully");
    }
    catch (error) {
        next(error);
    }
}
/* ==========================================================================
   ADMIN PACKAGES MANAGEMENT
   ========================================================================== */
/**
 * GET /api/dashboard/admin/packages
 */
async function getAdminPackages(req, res, next) {
    try {
        await (0, db_1.default)();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = {};
        if (req.query.search) {
            query.name = new RegExp(req.query.search, "i");
        }
        if (req.query.game && req.query.game !== "all") {
            query.game = req.query.game;
        }
        if (req.query.isActive !== undefined && req.query.isActive !== "all") {
            query.isActive = req.query.isActive === "true";
        }
        const [packages, total] = await Promise.all([
            package_model_1.default.find(query).populate("game", "name slug logo").sort({ createdAt: -1 }).skip(skip).limit(limit),
            package_model_1.default.countDocuments(query),
        ]);
        apiResponse_1.default.success(res, {
            packages,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }, "Packages retrieved successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/dashboard/admin/packages/:id
 */
async function getAdminPackageById(req, res, next) {
    try {
        await (0, db_1.default)();
        const pkg = await package_model_1.default.findById(req.params.id).populate("game", "name slug logo");
        if (!pkg) {
            throw new errorHandler_1.ApiError("Package not found", 404);
        }
        apiResponse_1.default.success(res, pkg, "Package details retrieved successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/dashboard/admin/packages
 */
async function createAdminPackage(req, res, next) {
    try {
        await (0, db_1.default)();
        const { game, name, amount, price, currency, description, isPopular, isActive } = req.body;
        if (!game)
            throw new errorHandler_1.ApiError("Game ID reference is required", 400);
        if (!name || !name.trim())
            throw new errorHandler_1.ApiError("Package name is required", 400);
        if (amount === undefined || Number(amount) <= 0)
            throw new errorHandler_1.ApiError("Amount must be greater than 0", 400);
        if (price === undefined || Number(price) <= 0)
            throw new errorHandler_1.ApiError("Price must be greater than 0", 400);
        const existGame = await game_model_1.default.findById(game);
        if (!existGame)
            throw new errorHandler_1.ApiError("Referenced game does not exist", 400);
        const pkg = await package_model_1.default.create({
            game,
            name: name.trim(),
            amount: Number(amount),
            price: Number(price),
            currency: currency ? currency.trim().toUpperCase() : "USD",
            description: description ? description.trim() : "",
            isPopular: isPopular !== undefined ? Boolean(isPopular) : false,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
        });
        const populated = await package_model_1.default.findById(pkg._id).populate("game", "name slug logo");
        apiResponse_1.default.success(res, populated, "Package created successfully", 201);
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/dashboard/admin/packages/:id
 */
async function updateAdminPackage(req, res, next) {
    try {
        await (0, db_1.default)();
        const pkgId = req.params.id;
        const body = req.body || {};
        const pkg = await package_model_1.default.findById(pkgId);
        if (!pkg) {
            throw new errorHandler_1.ApiError("Package not found", 404);
        }
        if (body.price !== undefined && Number(body.price) <= 0) {
            throw new errorHandler_1.ApiError("Price must be greater than 0", 400);
        }
        if (body.amount !== undefined && Number(body.amount) <= 0) {
            throw new errorHandler_1.ApiError("Amount must be greater than 0", 400);
        }
        if (body.game) {
            const existGame = await game_model_1.default.findById(body.game);
            if (!existGame)
                throw new errorHandler_1.ApiError("Referenced game does not exist", 400);
        }
        const updated = await package_model_1.default.findByIdAndUpdate(pkgId, body, { new: true, runValidators: true }).populate("game", "name slug logo");
        apiResponse_1.default.success(res, updated, "Package updated successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/dashboard/admin/packages/:id
 */
async function deleteAdminPackage(req, res, next) {
    try {
        await (0, db_1.default)();
        const pkg = await package_model_1.default.findByIdAndDelete(req.params.id);
        if (!pkg) {
            throw new errorHandler_1.ApiError("Package not found", 404);
        }
        apiResponse_1.default.success(res, null, "Package deleted successfully");
    }
    catch (error) {
        next(error);
    }
}
// ─────────────────────────────────────────────────────────────
// ORDER MANAGEMENT
// ─────────────────────────────────────────────────────────────
const ALLOWED_ORDER_STATUSES = ["pending", "processing", "completed", "cancelled"];
/**
 * GET /api/dashboard/admin/orders
 * Returns paginated, searchable, filtered list of all orders.
 */
async function getAdminOrders(req, res, next) {
    try {
        await (0, db_1.default)();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const baseQuery = {};
        if (req.query.orderStatus && req.query.orderStatus !== "all") {
            baseQuery.orderStatus = req.query.orderStatus;
        }
        if (req.query.paymentStatus && req.query.paymentStatus !== "all") {
            baseQuery.paymentStatus = req.query.paymentStatus;
        }
        const searchTerm = req.query.search;
        let orders;
        let total;
        if (searchTerm) {
            const searchRegex = new RegExp(searchTerm, "i");
            const isObjectId = mongoose_1.default.Types.ObjectId.isValid(searchTerm);
            const matchConditions = [
                { "userDoc.name": searchRegex },
                { "userDoc.email": searchRegex },
                { "gameDoc.name": searchRegex },
                { playerId: searchRegex },
            ];
            if (isObjectId) {
                matchConditions.push({ _id: new mongoose_1.default.Types.ObjectId(searchTerm) });
            }
            const pipeline = [
                { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "userDoc" } },
                { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "games", localField: "game", foreignField: "_id", as: "gameDoc" } },
                { $unwind: { path: "$gameDoc", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "packages", localField: "package", foreignField: "_id", as: "packageDoc" } },
                { $unwind: { path: "$packageDoc", preserveNullAndEmptyArrays: true } },
                {
                    $match: {
                        ...baseQuery,
                        $or: matchConditions,
                    },
                },
                { $sort: { createdAt: -1 } },
            ];
            const [countResult, docs] = await Promise.all([
                order_model_1.default.aggregate([...pipeline, { $count: "total" }]),
                order_model_1.default.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
            ]);
            total = countResult[0]?.total || 0;
            orders = docs.map((doc) => ({
                ...doc,
                user: doc.userDoc,
                game: doc.gameDoc,
                package: doc.packageDoc,
            }));
        }
        else {
            [orders, total] = await Promise.all([
                order_model_1.default.find(baseQuery)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate("user", "name email role avatar")
                    .populate("game", "name logo platform category")
                    .populate("package", "name price amount"),
                order_model_1.default.countDocuments(baseQuery),
            ]);
        }
        apiResponse_1.default.success(res, { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, "Orders list retrieved successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/dashboard/admin/orders/:id
 * Returns full order details with all populated references.
 */
async function getAdminOrderById(req, res, next) {
    try {
        await (0, db_1.default)();
        const order = await order_model_1.default.findById(req.params.id)
            .populate("user", "name email role avatar createdAt isActive")
            .populate("game", "name logo platform category slug")
            .populate("package", "name price amount currency description");
        if (!order) {
            throw new errorHandler_1.ApiError("Order not found", 404);
        }
        const payment = await payment_model_1.default.findOne({ order: order._id }).select("paymentStatus paymentMethod transactionId amount createdAt");
        apiResponse_1.default.success(res, { order, payment }, "Order details retrieved successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/dashboard/admin/orders/:id/status
 * Allows admin to update an order's orderStatus.
 */
async function updateAdminOrderStatus(req, res, next) {
    try {
        await (0, db_1.default)();
        const { orderStatus } = req.body;
        if (!orderStatus) {
            throw new errorHandler_1.ApiError("orderStatus is required", 400);
        }
        if (!ALLOWED_ORDER_STATUSES.includes(orderStatus)) {
            throw new errorHandler_1.ApiError(`Invalid order status. Allowed: ${ALLOWED_ORDER_STATUSES.join(", ")}`, 400);
        }
        const order = await order_model_1.default.findById(req.params.id);
        if (!order) {
            throw new errorHandler_1.ApiError("Order not found", 404);
        }
        order.orderStatus = orderStatus;
        await order.save();
        const populated = await order_model_1.default.findById(order._id)
            .populate("user", "name email role")
            .populate("game", "name logo")
            .populate("package", "name price");
        apiResponse_1.default.success(res, populated, "Order status updated successfully");
    }
    catch (error) {
        next(error);
    }
}
// ─────────────────────────────────────────────────────────────
// PAYMENT MANAGEMENT
// ─────────────────────────────────────────────────────────────
/**
 * GET /api/dashboard/admin/payments
 * Returns paginated, searchable, filtered list of all payments.
 */
async function getAdminPayments(req, res, next) {
    try {
        await (0, db_1.default)();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const baseQuery = {};
        if (req.query.paymentMethod && req.query.paymentMethod !== "all") {
            baseQuery.paymentMethod = req.query.paymentMethod;
        }
        if (req.query.paymentStatus && req.query.paymentStatus !== "all") {
            baseQuery.paymentStatus = req.query.paymentStatus;
        }
        const searchTerm = req.query.search;
        let payments;
        let total;
        if (searchTerm) {
            const searchRegex = new RegExp(searchTerm, "i");
            const isObjectId = mongoose_1.default.Types.ObjectId.isValid(searchTerm);
            const matchConditions = [
                { transactionId: searchRegex },
                { "userDoc.name": searchRegex },
                { "userDoc.email": searchRegex },
            ];
            if (isObjectId) {
                matchConditions.push({ order: new mongoose_1.default.Types.ObjectId(searchTerm) });
            }
            const pipeline = [
                { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "userDoc" } },
                { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "orders", localField: "order", foreignField: "_id", as: "orderDoc" } },
                { $unwind: { path: "$orderDoc", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "games", localField: "orderDoc.game", foreignField: "_id", as: "gameDoc" } },
                { $unwind: { path: "$gameDoc", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "packages", localField: "orderDoc.package", foreignField: "_id", as: "packageDoc" } },
                { $unwind: { path: "$packageDoc", preserveNullAndEmptyArrays: true } },
                {
                    $match: {
                        ...baseQuery,
                        $or: matchConditions,
                    },
                },
                { $sort: { createdAt: -1 } },
            ];
            const [countResult, docs] = await Promise.all([
                payment_model_1.default.aggregate([...pipeline, { $count: "total" }]),
                payment_model_1.default.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
            ]);
            total = countResult[0]?.total || 0;
            payments = docs.map((doc) => ({
                ...doc,
                user: doc.userDoc,
                order: doc.orderDoc ? { ...doc.orderDoc, game: doc.gameDoc, package: doc.packageDoc } : null,
            }));
        }
        else {
            [payments, total] = await Promise.all([
                payment_model_1.default.find(baseQuery)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate("user", "name email role avatar")
                    .populate({
                    path: "order",
                    select: "playerId playerName orderStatus paymentStatus totalPrice game package",
                    populate: [
                        { path: "game", select: "name logo platform category" },
                        { path: "package", select: "name price amount" },
                    ],
                }),
                payment_model_1.default.countDocuments(baseQuery),
            ]);
        }
        apiResponse_1.default.success(res, { payments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, "Payments list retrieved successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/dashboard/admin/payments/:id
 * Returns full payment details with all populated references.
 */
async function getAdminPaymentById(req, res, next) {
    try {
        await (0, db_1.default)();
        const payment = await payment_model_1.default.findById(req.params.id)
            .populate("user", "name email role avatar createdAt isActive")
            .populate({
            path: "order",
            select: "playerId playerName orderStatus paymentStatus paymentMethod unitPrice totalPrice quantity createdAt game package",
            populate: [
                { path: "game", select: "name logo platform category slug" },
                { path: "package", select: "name price amount currency description" },
                { path: "user", select: "name email role" },
            ],
        });
        if (!payment) {
            throw new errorHandler_1.ApiError("Payment not found", 404);
        }
        apiResponse_1.default.success(res, { payment }, "Payment details retrieved successfully");
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=admin.controller.js.map