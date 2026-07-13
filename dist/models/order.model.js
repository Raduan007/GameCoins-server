"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const order_schema_1 = require("./order.schema");
const Order = mongoose_1.default.models.Order || mongoose_1.default.model("Order", order_schema_1.OrderSchema);
exports.default = Order;
//# sourceMappingURL=order.model.js.map