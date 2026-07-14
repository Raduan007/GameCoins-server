import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import connectDB from "../config/db";
import apiResponse from "../utils/apiResponse";
import { ApiError } from "../middleware/errorHandler";
import Order from "../models/order.model";
import Payment from "../models/payment.model";

const REQUIRED_FIELDS = ["orderId", "paymentMethod"] as const;
const ALLOWED_PAYMENT_METHODS = ["bkash", "nagad", "card", "sslcommerz"] as const;

/**
 * POST /api/payments
 * Creates a pending payment record for an order owned by the user.
 */
export async function createPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { orderId, paymentMethod } = req.body;
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

    // 2. Validate paymentMethod
    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      throw new ApiError(
        `Invalid payment method. Allowed values: ${ALLOWED_PAYMENT_METHODS.join(", ")}`,
        400
      );
    }

    // Validate ObjectId structure
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new ApiError("Order not found", 404);
    }

    // 3. Find and validate Order
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    // Verify ownership
    const orderUserId = typeof order.user === "object" && order.user !== null && "_id" in order.user
      ? (order.user as any)._id.toString()
      : order.user.toString();

    if (orderUserId !== userId) {
      throw new ApiError("Forbidden", 403);
    }

    // 4. Prevent duplicate payments: Check if a pending or paid payment already exists for this order
    const existingPayment = await Payment.findOne({
      order: orderId,
      paymentStatus: { $in: ["pending", "paid"] },
    });

    if (existingPayment) {
      throw new ApiError("Payment already exists", 400);
    }

    // 5. Create Payment
    const payment = await Payment.create({
      user: userId,
      order: orderId,
      amount: order.totalPrice,
      paymentMethod,
      paymentStatus: "pending",
      status: "pending",
    });

    // 6. Return response
    apiResponse.success(
      res,
      payment,
      "Payment created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/payments
 * Fetches the payment history for the logged-in user, sorted by newest first.
 * Populates order, and nested game and package details.
 */
export async function getPayments(
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
        select: "playerId playerName orderStatus paymentStatus createdAt game package",
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
 * GET /api/payments/:id
 * Fetches the details of a specific payment.
 * Populates user (name, email), order, and nested game and package details.
 * Enforces ownership or admin role authorization.
 */
export async function getPaymentById(
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
      throw new ApiError("Payment not found", 404);
    }

    const payment = await Payment.findById(id)
      .populate("user", "name email")
      .populate({
        path: "order",
        select: "playerId playerName orderStatus paymentStatus game package",
        populate: [
          {
            path: "game",
          },
          {
            path: "package",
          },
        ],
      });

    if (!payment) {
      throw new ApiError("Payment not found", 404);
    }

    // Check ownership or admin status
    const paymentUserId = typeof payment.user === "object" && payment.user !== null && "_id" in payment.user
      ? (payment.user as any)._id.toString()
      : payment.user.toString();

    if (paymentUserId !== userId && userRole !== "admin") {
      throw new ApiError("Forbidden", 403);
    }

    apiResponse.success(res, payment, "Payment fetched successfully", 200);
  } catch (error) {
    next(error);
  }
}

const ALLOWED_PAYMENT_STATUSES = ["pending", "paid", "failed"] as const;

/**
 * PATCH /api/payments/:id/status
 * Updates payment status (Admin Only).
 * If status becomes 'paid', updates the related order status to 'completed'.
 */
export async function updatePaymentStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { id } = req.params;
    const { paymentStatus } = req.body;
    const userRole = req.user?.role;

    // 1. Only admin users can update payment status
    if (userRole !== "admin") {
      throw new ApiError("Forbidden", 403);
    }

    // 2. Validate payment ID
    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Payment not found", 404);
    }

    // 3. Validate status value
    if (paymentStatus === undefined || !ALLOWED_PAYMENT_STATUSES.includes(paymentStatus)) {
      throw new ApiError("Invalid payment status", 400);
    }

    // 4. Find payment
    const payment = await Payment.findById(id);
    if (!payment) {
      throw new ApiError("Payment not found", 404);
    }

    // 5. Update paymentStatus
    payment.paymentStatus = paymentStatus;
    await payment.save();

    // 6. When paymentStatus becomes "paid", update related order
    if (paymentStatus === "paid") {
      const order = await Order.findById(payment.order);
      if (!order) {
        throw new ApiError("Related order not found", 404);
      }
      order.orderStatus = "completed";
      order.paymentStatus = "paid";
      await order.save();
    }

    apiResponse.success(res, payment, "Payment status updated successfully", 200);
  } catch (error) {
    next(error);
  }
}
