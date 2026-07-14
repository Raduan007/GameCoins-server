import { Router } from "express";
import {
  getAdminOverview,
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  getAdminGames,
  getAdminGameById,
  createAdminGame,
  updateAdminGame,
  deleteAdminGame,
  getAdminPackages,
  getAdminPackageById,
  createAdminPackage,
  updateAdminPackage,
  deleteAdminPackage,
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  getAdminPayments,
  getAdminPaymentById,
  getAdminReports,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  approveAdminPayment,
  rejectAdminPayment,
  suspendAdminUser,
  blockAdminUser,
  activateAdminUser,
} from "../controllers/admin.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

// Secure all admin routes with authentication and role verification
router.use(authenticate, authorizeRoles("admin"));

router.get("/overview", getAdminOverview);
router.get("/reports", getAdminReports);

// Profile & Settings
router.get("/profile", getAdminProfile);
router.patch("/profile", updateAdminProfile);
router.patch("/profile/password", changeAdminPassword);

// User Management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/suspend", suspendAdminUser);
router.patch("/users/:id/block", blockAdminUser);
router.patch("/users/:id/activate", activateAdminUser);

// Games Management
router.get("/games", getAdminGames);
router.get("/games/:id", getAdminGameById);
router.post("/games", createAdminGame);
router.patch("/games/:id", updateAdminGame);
router.delete("/games/:id", deleteAdminGame);

// Packages Management
router.get("/packages", getAdminPackages);
router.get("/packages/:id", getAdminPackageById);
router.post("/packages", createAdminPackage);
router.patch("/packages/:id", updateAdminPackage);
router.delete("/packages/:id", deleteAdminPackage);

// Order Management
router.get("/orders", getAdminOrders);
router.get("/orders/:id", getAdminOrderById);
router.patch("/orders/:id/status", updateAdminOrderStatus);

// Payment Management
router.get("/payments", getAdminPayments);
router.get("/payments/:id", getAdminPaymentById);
router.patch("/payments/:id/approve", approveAdminPayment);
router.patch("/payments/:id/reject", rejectAdminPayment);

export default router;
