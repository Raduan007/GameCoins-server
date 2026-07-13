"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.authenticate, payment_controller_1.createPayment);
router.get("/", auth_middleware_1.authenticate, payment_controller_1.getPayments);
router.get("/:id", auth_middleware_1.authenticate, payment_controller_1.getPaymentById);
router.patch("/:id/status", auth_middleware_1.authenticate, payment_controller_1.updatePaymentStatus);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map