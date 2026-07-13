"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/overview", auth_middleware_1.authenticate, dashboard_controller_1.getDashboardOverview);
router.get("/orders", auth_middleware_1.authenticate, dashboard_controller_1.getBuyerOrders);
router.get("/orders/:id", auth_middleware_1.authenticate, dashboard_controller_1.getBuyerOrderById);
router.get("/payments", auth_middleware_1.authenticate, dashboard_controller_1.getBuyerPayments);
router.get("/wishlist", auth_middleware_1.authenticate, dashboard_controller_1.getBuyerWishlist);
router.post("/wishlist", auth_middleware_1.authenticate, dashboard_controller_1.addToWishlist);
router.delete("/wishlist/:id", auth_middleware_1.authenticate, dashboard_controller_1.removeFromWishlist);
router.get("/profile", auth_middleware_1.authenticate, dashboard_controller_1.getBuyerProfile);
router.patch("/profile", auth_middleware_1.authenticate, dashboard_controller_1.updateBuyerProfile);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map