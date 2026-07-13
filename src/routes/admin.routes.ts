import { Router } from "express";
import {
  getAdminOverview,
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
} from "../controllers/admin.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

// Secure all admin routes with authentication and role verification
router.use(authenticate, authorizeRoles("admin"));

router.get("/overview", getAdminOverview);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", updateUserStatus);

export default router;
