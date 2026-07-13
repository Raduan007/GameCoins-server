import { Router } from "express";
import { createOrder, getOrders } from "../controllers/order.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createOrder);
router.get("/", authenticate, getOrders);

export default router;
