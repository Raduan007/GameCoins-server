import { Router } from "express";
import { createOrder, getOrders, getOrderById, cancelOrder, updateOrderStatus } from "../controllers/order.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createOrder);
router.get("/", authenticate, getOrders);
router.get("/:id", authenticate, getOrderById);
router.patch("/:id/cancel", authenticate, cancelOrder);
router.patch("/:id/status", authenticate, authorizeRoles("admin"), updateOrderStatus);

export default router;
