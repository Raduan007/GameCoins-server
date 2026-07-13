import { Router } from "express";
import { getDashboardOverview, getBuyerOrders } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/overview", authenticate, getDashboardOverview);
router.get("/orders", authenticate, getBuyerOrders);

export default router;

