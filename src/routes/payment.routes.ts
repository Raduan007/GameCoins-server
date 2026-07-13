import { Router } from "express";
import { createPayment, getPayments } from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createPayment);
router.get("/", authenticate, getPayments);

export default router;
