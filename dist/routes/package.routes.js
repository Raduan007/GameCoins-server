"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const package_controller_1 = require("../controllers/package.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/", package_controller_1.getPackages);
router.post("/", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)("admin"), package_controller_1.createPackage);
router.patch("/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)("admin"), package_controller_1.updatePackage);
router.delete("/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)("admin"), package_controller_1.deletePackage);
exports.default = router;
//# sourceMappingURL=package.routes.js.map