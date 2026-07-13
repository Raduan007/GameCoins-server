import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import connectDB from "../config/db";
import apiResponse from "../utils/apiResponse";
import { ApiError } from "../middleware/errorHandler";
import Order from "../models/order.model";
import Payment from "../models/payment.model";
import Game from "../models/game.model";
import Wishlist from "../models/wishlist.model";
import User from "../models/user.model";

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

/**
 * GET /api/dashboard/orders/:id
 * Returns a specific order details for the logged-in user if they own it.
 * Populates game and package details.
 */
export async function getBuyerOrderById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError("Unauthorized", 401);
    }

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid order ID", 400);
    }

    const order = await Order.findById(id)
      .populate("game")
      .populate("package");

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    // Verify ownership
    const orderUserId = typeof order.user === "object" && order.user !== null && "_id" in order.user
      ? (order.user as any)._id.toString()
      : order.user.toString();

    if (orderUserId !== userId) {
      throw new ApiError("Order not found", 404);
    }

    apiResponse.success(res, order, "Order fetched successfully", 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/payments
 * Returns all payments belonging to the logged-in user.
 * Populates order details, and nested game and package details.
 * Sorted by newest first.
 */
export async function getBuyerPayments(
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

    const payments = await Payment.find({ user: userId })
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
      apiResponse.success(res, [], "No payments found", 200);
      return;
    }

    apiResponse.success(res, payments, "Payments fetched successfully", 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/wishlist
 * Returns wishlist items for the logged-in user.
 * Populates game details.
 * Sorted by newest first.
 */
export async function getBuyerWishlist(
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

    const wishlist = await Wishlist.find({ user: userId })
      .populate("game")
      .sort({ createdAt: -1 });

    if (wishlist.length === 0) {
      apiResponse.success(res, [], "No wishlist items found", 200);
      return;
    }

    apiResponse.success(res, wishlist, "Wishlist fetched successfully", 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/dashboard/wishlist
 * Adds a game to the logged-in user's wishlist.
 */
export async function addToWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const userId = req.user?.userId;
    const { gameId } = req.body;

    if (!userId) {
      throw new ApiError("Unauthorized", 401);
    }

    if (!gameId || typeof gameId !== "string" || !mongoose.Types.ObjectId.isValid(gameId)) {
      throw new ApiError("Invalid game ID", 400);
    }

    const game = await Game.findById(gameId);
    if (!game) {
      throw new ApiError("Game not found", 404);
    }

    // Check duplicate
    const existing = await Wishlist.findOne({ user: userId, game: gameId });
    if (existing) {
      throw new ApiError("Game already in wishlist", 400);
    }

    const wishlistItem = await Wishlist.create({
      user: userId,
      game: gameId,
    });

    apiResponse.success(res, wishlistItem, "Added to wishlist", 201);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/dashboard/wishlist/:id
 * Removes a game from the logged-in user's wishlist.
 */
export async function removeFromWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new ApiError("Unauthorized", 401);
    }

    if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Wishlist item not found", 404);
    }

    const wishlistItem = await Wishlist.findById(id);
    if (!wishlistItem) {
      throw new ApiError("Wishlist item not found", 404);
    }

    const wishlistUserId = typeof wishlistItem.user === "object" && wishlistItem.user !== null && "_id" in wishlistItem.user
      ? (wishlistItem.user as any)._id.toString()
      : wishlistItem.user.toString();

    if (wishlistUserId !== userId) {
      throw new ApiError("Wishlist item not found", 404);
    }

    await Wishlist.deleteOne({ _id: id });

    apiResponse.success(res, null, "Removed from wishlist", 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/profile
 * Returns the logged-in user's profile details.
 * Excludes sensitive fields like password.
 */
export async function getBuyerProfile(
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

    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    apiResponse.success(res, user, "Profile fetched successfully", 200);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/dashboard/profile
 * Updates the logged-in user's profile name.
 * Disallows updating email, role, or status/isActive.
 */
export async function updateBuyerProfile(
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

    const { name } = req.body;

    if (name === undefined || name === null || (typeof name === "string" && name.trim() === "")) {
      throw new ApiError("Name is required", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    user.name = name.trim();
    await user.save();

    const updatedUser = await User.findById(userId).select("-password");

    apiResponse.success(res, updatedUser, "Profile updated successfully", 200);
  } catch (error) {
    next(error);
  }
}





