"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.authenticate, payment_controller_1.createPayment);
router.get("/", auth_middleware_1.authenticate, payment_controller_1.getPayments);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map