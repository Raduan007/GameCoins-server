import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import connectDB from "../config/db";
import apiResponse from "../utils/apiResponse";
import { ApiError } from "../middleware/errorHandler";
import User from "../models/user.model";
import Order from "../models/order.model";
import Payment from "../models/payment.model";
import Wishlist from "../models/wishlist.model";
import Game from "../models/game.model";
import Package from "../models/package.model";

/**
 * GET /api/dashboard/admin/overview
 * Returns admin dashboard summary statistics and recent orders.
 */
export async function getAdminOverview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    // Verify requesting user is admin
    if (!req.user || req.user.role !== "admin") {
      throw new ApiError("Forbidden: Admin access required", 403);
    }

    // Gather dashboard statistics
    const [totalUsers, totalSellers, totalOrders, revenueResult] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "seller" }),
      Order.countDocuments(),
      Order.aggregate([
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
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email role avatar")
      .populate("game", "name logo platform category")
      .populate("package", "name price");

    apiResponse.success(
      res,
      {
        totalUsers,
        totalSellers,
        totalOrders,
        totalRevenue,
        recentOrders,
      },
      "Admin overview statistics fetched successfully"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/admin/users
 * Returns a paginated, searchable, sorted, and filtered list of users.
 */
export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    // Verify requesting user is admin
    if (!req.user || req.user.role !== "admin") {
      throw new ApiError("Forbidden: Admin access required", 403);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};

    // Search by name or email
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, "i");
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
    let sortOption: any = { createdAt: -1 }; // default newest
    if (req.query.sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (req.query.sort === "name") {
      sortOption = { name: 1 };
    }

    const [users, total] = await Promise.all([
      User.find(query).sort(sortOption).skip(skip).limit(limit).select("-password"),
      User.countDocuments(query),
    ]);

    apiResponse.success(
      res,
      {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Users list retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/admin/users/:id
 * Returns single user details, recent orders/payments, and wishlist count.
 */
export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    // Verify requesting user is admin
    if (!req.user || req.user.role !== "admin") {
      throw new ApiError("Forbidden: Admin access required", 403);
    }

    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    const [recentOrders, payments, wishlistCount] = await Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("game", "name logo platform category")
        .populate("package", "name price"),
      Payment.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("order", "totalPrice orderStatus"),
      Wishlist.countDocuments({ user: userId }),
    ]);

    apiResponse.success(
      res,
      {
        user,
        recentOrders,
        payments,
        wishlistCount,
      },
      "User details retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/dashboard/admin/users/:id/role
 * Updates a user's system role.
 */
export async function updateUserRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    // Verify requesting user is admin
    if (!req.user || req.user.role !== "admin") {
      throw new ApiError("Forbidden: Admin access required", 403);
    }

    const userId = req.params.id;
    const { role } = req.body;

    const allowedRoles = ["user", "seller", "admin"];
    if (!role || !allowedRoles.includes(role)) {
      throw new ApiError("Invalid user role provided", 400);
    }

    // Prevent changing own role
    if (userId === req.user.userId) {
      throw new ApiError("Forbidden: Cannot change your own role", 400);
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    apiResponse.success(res, user, "User role updated successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/dashboard/admin/users/:id/status
 * Disables or enables a user account.
 */
export async function updateUserStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    // Verify requesting user is admin
    if (!req.user || req.user.role !== "admin") {
      throw new ApiError("Forbidden: Admin access required", 403);
    }

    const userId = req.params.id;
    const { isActive } = req.body;

    if (isActive === undefined || typeof isActive !== "boolean") {
      throw new ApiError("Invalid isActive status type", 400);
    }

    // Prevent disabling own account
    if (userId === req.user.userId) {
      throw new ApiError("Forbidden: Cannot disable your own account", 400);
    }

    const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true }).select("-password");
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    apiResponse.success(res, user, "User status updated successfully");
  } catch (error) {
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
export async function getAdminGames(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await connectDB();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.search) {
      query.name = new RegExp(req.query.search as string, "i");
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

    let sortOption: any = { createdAt: -1 };
    if (req.query.sort === "oldest") sortOption = { createdAt: 1 };
    if (req.query.sort === "name") sortOption = { name: 1 };
    if (req.query.sort === "rating") sortOption = { rating: -1 };

    const [games, total] = await Promise.all([
      Game.find(query).sort(sortOption).skip(skip).limit(limit),
      Game.countDocuments(query),
    ]);

    apiResponse.success(res, {
      games,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, "Games retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/admin/games/:id
 */
export async function getAdminGameById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await connectDB();
    const game = await Game.findById(req.params.id);
    if (!game) {
      throw new ApiError("Game not found", 404);
    }
    apiResponse.success(res, game, "Game details retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/dashboard/admin/games
 */
export async function createAdminGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await connectDB();
    const {
      name,
      slug,
      shortDescription,
      fullDescription,
      category,
      platform,
      publisher,
      logo,
      banner,
      rating,
      isPopular,
      isFeatured,
      isActive,
    } = req.body;

    if (!name || !name.trim()) {
      throw new ApiError("Game name is required", 400);
    }
    if (!slug || !slug.trim()) {
      throw new ApiError("Game slug is required", 400);
    }

    // Rating check
    const numRating = rating !== undefined ? Number(rating) : 0;
    if (numRating < 0 || numRating > 5) {
      throw new ApiError("Rating must be between 0 and 5", 400);
    }

    // Check duplicate name
    const dupName = await Game.findOne({ name: name.trim() });
    if (dupName) {
      throw new ApiError("A game with this name already exists", 400);
    }

    // Check duplicate slug
    const dupSlug = await Game.findOne({ slug: slug.trim().toLowerCase() });
    if (dupSlug) {
      throw new ApiError("A game with this slug already exists", 400);
    }

    const game = await Game.create({
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

    apiResponse.success(res, game, "Game created successfully", 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/dashboard/admin/games/:id
 */
export async function updateAdminGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await connectDB();
    const gameId = req.params.id;
    const body = req.body || {};

    const game = await Game.findById(gameId);
    if (!game) {
      throw new ApiError("Game not found", 404);
    }

    if (body.name && body.name.trim() !== game.name) {
      const dupName = await Game.findOne({ name: body.name.trim(), _id: { $ne: gameId } });
      if (dupName) throw new ApiError("A game with this name already exists", 400);
    }

    if (body.slug && body.slug.trim().toLowerCase() !== game.slug) {
      const dupSlug = await Game.findOne({ slug: body.slug.trim().toLowerCase(), _id: { $ne: gameId } });
      if (dupSlug) throw new ApiError("A game with this slug already exists", 400);
    }

    if (body.rating !== undefined) {
      const numRating = Number(body.rating);
      if (numRating < 0 || numRating > 5) {
        throw new ApiError("Rating must be between 0 and 5", 400);
      }
    }

    const updated = await Game.findByIdAndUpdate(gameId, body, { new: true, runValidators: true });
    apiResponse.success(res, updated, "Game updated successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/dashboard/admin/games/:id
 */
export async function deleteAdminGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await connectDB();
    const game = await Game.findByIdAndDelete(req.params.id);
    if (!game) {
      throw new ApiError("Game not found", 404);
    }
    apiResponse.success(res, null, "Game deleted successfully");
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   ADMIN PACKAGES MANAGEMENT
   ========================================================================== */

/**
 * GET /api/dashboard/admin/packages
 */
export async function getAdminPackages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await connectDB();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.search) {
      query.name = new RegExp(req.query.search as string, "i");
    }
    if (req.query.game && req.query.game !== "all") {
      query.game = req.query.game;
    }
    if (req.query.isActive !== undefined && req.query.isActive !== "all") {
      query.isActive = req.query.isActive === "true";
    }

    const [packages, total] = await Promise.all([
      Package.find(query).populate("game", "name slug logo").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Package.countDocuments(query),
    ]);

    apiResponse.success(res, {
      packages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, "Packages retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/admin/packages/:id
 */
export async function getAdminPackageById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await connectDB();
    const pkg = await Package.findById(req.params.id).populate("game", "name slug logo");
    if (!pkg) {
      throw new ApiError("Package not found", 404);
    }
    apiResponse.success(res, pkg, "Package details retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/dashboard/admin/packages
 */
export async function createAdminPackage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await connectDB();
    const { game, name, amount, price, currency, description, isPopular, isActive } = req.body;

    if (!game) throw new ApiError("Game ID reference is required", 400);
    if (!name || !name.trim()) throw new ApiError("Package name is required", 400);
    if (amount === undefined || Number(amount) <= 0) throw new ApiError("Amount must be greater than 0", 400);
    if (price === undefined || Number(price) <= 0) throw new ApiError("Price must be greater than 0", 400);

    const existGame = await Game.findById(game);
    if (!existGame) throw new ApiError("Referenced game does not exist", 400);

    const pkg = await Package.create({
      game,
      name: name.trim(),
      amount: Number(amount),
      price: Number(price),
      currency: currency ? currency.trim().toUpperCase() : "USD",
      description: description ? description.trim() : "",
      isPopular: isPopular !== undefined ? Boolean(isPopular) : false,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    const populated = await Package.findById(pkg._id).populate("game", "name slug logo");
    apiResponse.success(res, populated, "Package created successfully", 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/dashboard/admin/packages/:id
 */
export async function updateAdminPackage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await connectDB();
    const pkgId = req.params.id;
    const body = req.body || {};

    const pkg = await Package.findById(pkgId);
    if (!pkg) {
      throw new ApiError("Package not found", 404);
    }

    if (body.price !== undefined && Number(body.price) <= 0) {
      throw new ApiError("Price must be greater than 0", 400);
    }
    if (body.amount !== undefined && Number(body.amount) <= 0) {
      throw new ApiError("Amount must be greater than 0", 400);
    }

    if (body.game) {
      const existGame = await Game.findById(body.game);
      if (!existGame) throw new ApiError("Referenced game does not exist", 400);
    }

    const updated = await Package.findByIdAndUpdate(pkgId, body, { new: true, runValidators: true }).populate("game", "name slug logo");
    apiResponse.success(res, updated, "Package updated successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/dashboard/admin/packages/:id
 */
export async function deleteAdminPackage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await connectDB();
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) {
      throw new ApiError("Package not found", 404);
    }
    apiResponse.success(res, null, "Package deleted successfully");
  } catch (error) {
    next(error);
  }
}


// ─────────────────────────────────────────────────────────────
// ORDER MANAGEMENT
// ─────────────────────────────────────────────────────────────

const ALLOWED_ORDER_STATUSES = ["pending", "processing", "completed", "cancelled"] as const;

/**
 * GET /api/dashboard/admin/orders
 * Returns paginated, searchable, filtered list of all orders.
 */
export async function getAdminOrders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const baseQuery: any = {};

    if (req.query.orderStatus && req.query.orderStatus !== "all") {
      baseQuery.orderStatus = req.query.orderStatus;
    }

    if (req.query.paymentStatus && req.query.paymentStatus !== "all") {
      baseQuery.paymentStatus = req.query.paymentStatus;
    }

    const searchTerm = req.query.search as string;
    let orders: any[];
    let total: number;

    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, "i");
      const isObjectId = mongoose.Types.ObjectId.isValid(searchTerm);
      const matchConditions: any[] = [
        { "userDoc.name": searchRegex },
        { "userDoc.email": searchRegex },
        { "gameDoc.name": searchRegex },
        { playerId: searchRegex },
      ];
      if (isObjectId) {
        matchConditions.push({ _id: new mongoose.Types.ObjectId(searchTerm) });
      }

      const pipeline: any[] = [
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
        Order.aggregate([...pipeline, { $count: "total" }]),
        Order.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
      ]);

      total = countResult[0]?.total || 0;
      orders = docs.map((doc: any) => ({
        ...doc,
        user: doc.userDoc,
        game: doc.gameDoc,
        package: doc.packageDoc,
      }));
    } else {
      [orders, total] = await Promise.all([
        Order.find(baseQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("user", "name email role avatar")
          .populate("game", "name logo platform category")
          .populate("package", "name price amount"),
        Order.countDocuments(baseQuery),
      ]);
    }

    apiResponse.success(
      res,
      { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      "Orders list retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/admin/orders/:id
 * Returns full order details with all populated references.
 */
export async function getAdminOrderById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const order = await Order.findById(req.params.id)
      .populate("user", "name email role avatar createdAt isActive")
      .populate("game", "name logo platform category slug")
      .populate("package", "name price amount currency description");

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    const payment = await Payment.findOne({ order: order._id }).select(
      "paymentStatus paymentMethod transactionId amount createdAt"
    );

    apiResponse.success(res, { order, payment }, "Order details retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/dashboard/admin/orders/:id/status
 * Allows admin to update an order's orderStatus.
 */
export async function updateAdminOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { orderStatus } = req.body;

    if (!orderStatus) {
      throw new ApiError("orderStatus is required", 400);
    }

    if (!ALLOWED_ORDER_STATUSES.includes(orderStatus as any)) {
      throw new ApiError(
        `Invalid order status. Allowed: ${ALLOWED_ORDER_STATUSES.join(", ")}`,
        400
      );
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    order.orderStatus = orderStatus;
    await order.save();

    const populated = await Order.findById(order._id)
      .populate("user", "name email role")
      .populate("game", "name logo")
      .populate("package", "name price");

    apiResponse.success(res, populated, "Order status updated successfully");
  } catch (error) {
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
export async function getAdminPayments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const baseQuery: any = {};

    if (req.query.paymentMethod && req.query.paymentMethod !== "all") {
      baseQuery.paymentMethod = req.query.paymentMethod;
    }

    if (req.query.paymentStatus && req.query.paymentStatus !== "all") {
      baseQuery.paymentStatus = req.query.paymentStatus;
    }

    const searchTerm = req.query.search as string;
    let payments: any[];
    let total: number;

    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, "i");
      const isObjectId = mongoose.Types.ObjectId.isValid(searchTerm);
      const matchConditions: any[] = [
        { transactionId: searchRegex },
        { "userDoc.name": searchRegex },
        { "userDoc.email": searchRegex },
      ];
      if (isObjectId) {
        matchConditions.push({ order: new mongoose.Types.ObjectId(searchTerm) });
      }

      const pipeline: any[] = [
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
        Payment.aggregate([...pipeline, { $count: "total" }]),
        Payment.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
      ]);

      total = countResult[0]?.total || 0;
      payments = docs.map((doc: any) => ({
        ...doc,
        user: doc.userDoc,
        order: doc.orderDoc ? { ...doc.orderDoc, game: doc.gameDoc, package: doc.packageDoc } : null,
      }));
    } else {
      [payments, total] = await Promise.all([
        Payment.find(baseQuery)
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
        Payment.countDocuments(baseQuery),
      ]);
    }

    apiResponse.success(
      res,
      { payments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      "Payments list retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/admin/payments/:id
 * Returns full payment details with all populated references.
 */
export async function getAdminPaymentById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const payment = await Payment.findById(req.params.id)
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
      throw new ApiError("Payment not found", 404);
    }

    apiResponse.success(res, { payment }, "Payment details retrieved successfully");
  } catch (error) {
    next(error);
  }
}