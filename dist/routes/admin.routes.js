"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Secure all admin routes with authentication and role verification
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)("admin"));
router.get("/overview", admin_controller_1.getAdminOverview);
// User Management
router.get("/users", admin_controller_1.getAllUsers);
router.get("/users/:id", admin_controller_1.getUserById);
router.patch("/users/:id/role", admin_controller_1.updateUserRole);
router.patch("/users/:id/status", admin_controller_1.updateUserStatus);
// Games Management
router.get("/games", admin_controller_1.getAdminGames);
router.get("/games/:id", admin_controller_1.getAdminGameById);
router.post("/games", admin_controller_1.createAdminGame);
router.patch("/games/:id", admin_controller_1.updateAdminGame);
router.delete("/games/:id", admin_controller_1.deleteAdminGame);
// Packages Management
router.get("/packages", admin_controller_1.getAdminPackages);
router.get("/packages/:id", admin_controller_1.getAdminPackageById);
router.post("/packages", admin_controller_1.createAdminPackage);
router.patch("/packages/:id", admin_controller_1.updateAdminPackage);
router.delete("/packages/:id", admin_controller_1.deleteAdminPackage);
// Order Management
router.get("/orders", admin_controller_1.getAdminOrders);
router.get("/orders/:id", admin_controller_1.getAdminOrderById);
router.patch("/orders/:id/status", admin_controller_1.updateAdminOrderStatus);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map