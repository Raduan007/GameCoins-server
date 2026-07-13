"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = createPayment;
exports.getPayments = getPayments;
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = __importDefault(require("../config/db"));
const apiResponse_1 = __importDefault(require("../utils/apiResponse"));
const errorHandler_1 = require("../middleware/errorHandler");
const order_model_1 = __importDefault(require("../models/order.model"));
const payment_model_1 = __importDefault(require("../models/payment.model"));
const REQUIRED_FIELDS = ["orderId", "paymentMethod"];
const ALLOWED_PAYMENT_METHODS = ["bkash", "nagad", "card", "sslcommerz"];
/**
 * POST /api/payments
 * Creates a pending payment record for an order owned by the user.
 */
async function createPayment(req, res, next) {
    try {
        await (0, db_1.default)();
        const { orderId, paymentMethod } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errorHandler_1.ApiError("Unauthorized", 401);
        }
        // 1. Validate required fields
        const missingFields = REQUIRED_FIELDS.filter((field) => {
            const value = req.body[field];
            return (value === undefined ||
                value === null ||
                (typeof value === "string" && value.trim() === ""));
        });
        if (missingFields.length > 0) {
            throw new errorHandler_1.ApiError(`Missing required fields: ${missingFields.join(", ")}`, 400);
        }
        // 2. Validate paymentMethod
        if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
            throw new errorHandler_1.ApiError(`Invalid payment method. Allowed values: ${ALLOWED_PAYMENT_METHODS.join(", ")}`, 400);
        }
        // Validate ObjectId structure
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            throw new errorHandler_1.ApiError("Order not found", 404);
        }
        // 3. Find and validate Order
        const order = await order_model_1.default.findById(orderId);
        if (!order) {
            throw new errorHandler_1.ApiError("Order not found", 404);
        }
        // Verify ownership
        const orderUserId = typeof order.user === "object" && order.user !== null && "_id" in order.user
            ? order.user._id.toString()
            : order.user.toString();
        if (orderUserId !== userId) {
            throw new errorHandler_1.ApiError("Forbidden", 403);
        }
        // 4. Prevent duplicate payments: Check if a pending or paid payment already exists for this order
        const existingPayment = await payment_model_1.default.findOne({
            order: orderId,
            paymentStatus: { $in: ["pending", "paid"] },
        });
        if (existingPayment) {
            throw new errorHandler_1.ApiError("Payment already exists", 400);
        }
        // 5. Create Payment
        const payment = await payment_model_1.default.create({
            user: userId,
            order: orderId,
            amount: order.totalPrice,
            paymentMethod,
            paymentStatus: "pending",
        });
        // 6. Return response
        apiResponse_1.default.success(res, payment, "Payment created successfully", 201);
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/payments
 * Fetches the payment history for the logged-in user, sorted by newest first.
 * Populates order, and nested game and package details.
 */
async function getPayments(req, res, next) {
    try {
        await (0, db_1.default)();
        const userId = req.user?.userId;
        if (!userId) {
            throw new errorHandler_1.ApiError("Unauthorized", 401);
        }
        const payments = await payment_model_1.default.find({ user: userId })
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
            apiResponse_1.default.success(res, [], "No payments found", 200);
            return;
        }
        apiResponse_1.default.success(res, payments, "Payments fetched successfully", 200);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=payment.controller.js.map