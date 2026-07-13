"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const payment_schema_1 = require("./payment.schema");
const Payment = mongoose_1.default.models.Payment || mongoose_1.default.model("Payment", payment_schema_1.PaymentSchema);
exports.default = Payment;
//# sourceMappingURL=payment.model.js.map