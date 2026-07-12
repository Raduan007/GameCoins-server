"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const package_controller_1 = require("../controllers/package.controller");
const router = (0, express_1.Router)();
router.get("/", package_controller_1.getPackages);
router.post("/", package_controller_1.createPackage);
router.patch("/:id", package_controller_1.updatePackage);
router.delete("/:id", package_controller_1.deletePackage);
exports.default = router;
//# sourceMappingURL=package.routes.js.map