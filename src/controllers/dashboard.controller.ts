import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import connectDB from "../config/db";
import apiResponse from "../utils/apiResponse";
import { ApiError } from "../middleware/errorHandler";
import Order from "../models/order.model";

/**
 * GET /api/dashboard/overview
 * Returns dashboard summary metrics for the logged-in user.
 */
export async function getDashboardOverview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError("Unauthorized", 401);
    }

    const result = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
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

    apiResponse.success(res, data, "Dashboard summary fetched successfully", 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/orders
 * Returns all orders belonging to the logged-in user.
 * Populates game and package details.
 * Sorted by newest first.
 */
export async function getBuyerOrders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError("Unauthorized", 401);
    }

    const orders = await Order.find({ user: userId })
      .populate("game")
      .populate("package")
      .sort({ createdAt: -1 });

    if (orders.length === 0) {
      apiResponse.success(res, [], "No orders found", 200);
      return;
    }

    apiResponse.success(res, orders, "Orders fetched successfully", 200);
  } catch (error) {
    next(error);
  }
}

