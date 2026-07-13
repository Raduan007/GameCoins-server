"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/overview", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)("admin"), admin_controller_1.getAdminOverview);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map