import { Request, Response, NextFunction } from "express";
import connectDB from "../config/db";
import apiResponse from "../utils/apiResponse";
import { ApiError } from "../middleware/errorHandler";
import User from "../models/user.model";
import Order from "../models/order.model";
import Payment from "../models/payment.model";
import Wishlist from "../models/wishlist.model";

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
