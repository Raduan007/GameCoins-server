"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.authenticate, order_controller_1.createOrder);
router.get("/", auth_middleware_1.authenticate, order_controller_1.getOrders);
router.get("/:id", auth_middleware_1.authenticate, order_controller_1.getOrderById);
exports.default = router;
//# sourceMappingURL=order.routes.js.map