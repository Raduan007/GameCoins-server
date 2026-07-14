import { Router } from "express";
import {
  getDashboardOverview,
  getBuyerOrders,
  getBuyerOrderById,
  getBuyerPayments,
  getBuyerWishlist,
  addToWishlist,
  removeFromWishlist,
  getBuyerProfile,
  updateBuyerProfile,
  getSellerOverview,
} from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Buyer routes
router.get("/overview", authenticate, getDashboardOverview);
router.get("/orders", authenticate, getBuyerOrders);
router.get("/orders/:id", authenticate, getBuyerOrderById);
router.get("/payments", authenticate, getBuyerPayments);
router.get("/wishlist", authenticate, getBuyerWishlist);
router.post("/wishlist", authenticate, addToWishlist);
router.delete("/wishlist/:id", authenticate, removeFromWishlist);
router.get("/profile", authenticate, getBuyerProfile);
router.patch("/profile", authenticate, updateBuyerProfile);

// Seller routes
router.get("/seller/overview", authenticate, getSellerOverview);

export default router;