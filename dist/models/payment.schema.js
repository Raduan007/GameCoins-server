"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentSchema = void 0;
const mongoose_1 = require("mongoose");
exports.PaymentSchema = new mongoose_1.Schema({
    order: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Order",
        required: [true, "Order reference is required"],
        index: true,
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User reference is required"],
        index: true,
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0.01, "Amount must be positive"],
    },
    paymentMethod: {
        type: String,
        enum: {
            values: ["bkash", "nagad", "card", "sslcommerz"],
            message: "{VALUE} is not a valid payment method",
        },
        required: [true, "Payment method is required"],
    },
    paymentStatus: {
        type: String,
        enum: {
            values: ["pending", "paid", "failed"],
            message: "{VALUE} is not a valid payment status",
        },
        default: "pending",
        required: [true, "Payment status is required"],
        index: true,
    },
    transactionId: {
        type: String,
        trim: true,
        default: "",
    },
}, {
    timestamps: true,
    collection: "payments",
});
//# sourceMappingURL=payment.schema.js.map