"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderSchema = void 0;
const mongoose_1 = require("mongoose");
exports.OrderSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User reference is required"],
        index: true,
    },
    game: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Game",
        required: [true, "Game reference is required"],
        index: true,
    },
    package: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Package",
        required: [true, "Package reference is required"],
        index: true,
    },
    playerId: {
        type: String,
        required: [true, "Player ID is required"],
        trim: true,
    },
    playerName: {
        type: String,
        trim: true,
        default: "",
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity must be at least 1"],
        default: 1,
    },
    unitPrice: {
        type: Number,
        required: [true, "Unit price is required"],
        min: [0.01, "Unit price must be positive"],
    },
    totalPrice: {
        type: Number,
        required: [true, "Total price is required"],
        min: [0.01, "Total price must be positive"],
    },
    paymentMethod: {
        type: String,
        enum: {
            values: ["sslcommerz", "bkash", "nagad", "cod"],
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
    orderStatus: {
        type: String,
        enum: {
            values: ["pending", "processing", "completed", "cancelled"],
            message: "{VALUE} is not a valid order status",
        },
        default: "pending",
        required: [true, "Order status is required"],
        index: true,
    },
}, {
    timestamps: true,
    collection: "orders",
});
//# sourceMappingURL=order.schema.js.map