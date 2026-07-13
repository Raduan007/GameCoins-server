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
