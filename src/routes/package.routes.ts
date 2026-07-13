import { Router } from "express";
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
} from "../controllers/package.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getPackages);
router.post("/", authenticate, authorizeRoles("admin"), createPackage);
router.patch("/:id", authenticate, authorizeRoles("admin"), updatePackage);
router.delete("/:id", authenticate, authorizeRoles("admin"), deletePackage);

export default router;