import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import connectDB from "../config/db";
import apiResponse from "../utils/apiResponse";
import { ApiError } from "../middleware/errorHandler";
import Game from "../models/game.model";
import Package from "../models/package.model";
import Order from "../models/order.model";

const REQUIRED_FIELDS = ["gameId", "packageId", "playerId", "paymentMethod"] as const;
const ALLOWED_PAYMENT_METHODS = ["sslcommerz", "bkash", "nagad", "cod"] as const;

/**
 * POST /api/orders
 * Creates a new order for a game package.
 */
export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { gameId, packageId, playerId, playerName, quantity, paymentMethod } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError("Unauthorized", 401);
    }

    // 1. Validate required fields
    const missingFields = REQUIRED_FIELDS.filter((field) => {
      const value = req.body[field];
      return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      );
    });

    if (missingFields.length > 0) {
      throw new ApiError(
        `Missing required fields: ${missingFields.join(", ")}`,
        400
      );
    }

    // 2. Validate quantity
    const qty = quantity !== undefined ? Number(quantity) : 1;
    if (isNaN(qty) || qty < 1) {
      throw new ApiError("Quantity must be a number greater than or equal to 1", 400);
    }

    // 3. Validate paymentMethod
    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      throw new ApiError(
        `Invalid payment method. Must be one of: ${ALLOWED_PAYMENT_METHODS.join(", ")}`,
        400
      );
    }

    // 4. Verify Game exists and is active
    const game = await Game.findById(gameId).lean();
    if (!game || !game.isActive) {
      throw new ApiError("Game not found or inactive", 404);
    }

    // 5. Verify Package exists and is active
    const pkg = await Package.findById(packageId).lean();
    if (!pkg || !pkg.isActive) {
      throw new ApiError("Package not found or inactive", 404);
    }

    // Verify package belongs to the game
    if (pkg.game.toString() !== gameId) {
      throw new ApiError("The selected package does not belong to this game", 400);
    }

    // 6. Calculate Pricing
    const totalPrice = pkg.price * qty;

    // 7. Save Order
    const order = await Order.create({
      user: userId,
      game: gameId,
      package: packageId,
      playerId: playerId.trim(),
      playerName: playerName ? playerName.trim() : "",
      quantity: qty,
      unitPrice: pkg.price,
      totalPrice,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    // 8. Return response
    apiResponse.success(
      res,
      order,
      "Order created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders
 * Fetches the order history for the logged-in user, sorted by newest first.
 * Populates game and package details.
 */
export async function getOrders(
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
 * GET /api/orders/:id
 * Fetches details for a specific order.
 * Populates user (name, email), game, and package.
 * Restricts access to the order owner or an admin.
 */
export async function getOrderById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      throw new ApiError("Unauthorized", 401);
    }

    // Validate ObjectId structure
    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Order not found", 404);
    }

    const order = await Order.findById(id)
      .populate("user", "name email")
      .populate("game")
      .populate("package");

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    // Check ownership or admin status
    const orderUserId = typeof order.user === "object" && order.user !== null && "_id" in order.user
      ? (order.user as any)._id.toString()
      : order.user.toString();

    if (orderUserId !== userId && userRole !== "admin") {
      throw new ApiError("Forbidden", 403);
    }

    apiResponse.success(res, order, "Order fetched successfully", 200);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/orders/:id/cancel
 * Cancels a pending or processing order.
 * Enforces ownership or admin role authorization.
 */
export async function cancelOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      throw new ApiError("Unauthorized", 401);
    }

    // Validate ObjectId structure
    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Order not found", 404);
    }

    const order = await Order.findById(id);
    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    // Check ownership or admin status
    const orderUserId = typeof order.user === "object" && order.user !== null && "_id" in order.user
      ? (order.user as any)._id.toString()
      : order.user.toString();

    if (orderUserId !== userId && userRole !== "admin") {
      throw new ApiError("Forbidden", 403);
    }

    // Validation rules
    if (order.orderStatus === "cancelled") {
      throw new ApiError("Order is already cancelled", 400);
    }

    if (order.orderStatus === "completed") {
      throw new ApiError("Completed orders cannot be cancelled", 400);
    }

    // Cancellation
    order.orderStatus = "cancelled";
    await order.save();

    apiResponse.success(res, order, "Order cancelled successfully", 200);
  } catch (error) {
    next(error);
  }
}

const ALLOWED_ORDER_STATUSES = ["pending", "processing", "completed", "cancelled"] as const;
const ALLOWED_PAYMENT_STATUSES = ["pending", "paid", "failed"] as const;

/**
 * PATCH /api/orders/:id/status
 * Updates the orderStatus and/or paymentStatus of any order.
 * Restricted to admin role users only.
 */
export async function updateOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    // Validate ObjectId structure
    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Order not found", 404);
    }

    // Validation of incoming fields
    if (orderStatus !== undefined && !ALLOWED_ORDER_STATUSES.includes(orderStatus)) {
      throw new ApiError(
        `Invalid order status. Allowed values: ${ALLOWED_ORDER_STATUSES.join(", ")}`,
        400
      );
    }

    if (paymentStatus !== undefined && !ALLOWED_PAYMENT_STATUSES.includes(paymentStatus)) {
      throw new ApiError(
        `Invalid payment status. Allowed values: ${ALLOWED_PAYMENT_STATUSES.join(", ")}`,
        400
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    // Apply updates if they were provided
    if (orderStatus !== undefined) {
      order.orderStatus = orderStatus;
    }
    if (paymentStatus !== undefined) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    apiResponse.success(res, order, "Order status updated successfully", 200);
  } catch (error) {
    next(error);
  }
}
