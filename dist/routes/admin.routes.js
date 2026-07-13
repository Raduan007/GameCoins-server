"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Secure all admin routes with authentication and role verification
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)("admin"));
router.get("/overview", admin_controller_1.getAdminOverview);
router.get("/users", admin_controller_1.getAllUsers);
router.get("/users/:id", admin_controller_1.getUserById);
router.patch("/users/:id/role", admin_controller_1.updateUserRole);
router.patch("/users/:id/status", admin_controller_1.updateUserStatus);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map