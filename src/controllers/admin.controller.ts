import { Request, Response, NextFunction } from "express";
import connectDB from "../config/db";
import apiResponse from "../utils/apiResponse";
import { ApiError } from "../middleware/errorHandler";
import User from "../models/user.model";
import Order from "../models/order.model";

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
