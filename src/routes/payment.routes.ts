import { Router } from "express";
import { createPayment, getPayments, getPaymentById, updatePaymentStatus } from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createPayment);
router.get("/", authenticate, getPayments);
router.get("/:id", authenticate, getPaymentById);
router.patch("/:id/status", authenticate, updatePaymentStatus);

export default router;
