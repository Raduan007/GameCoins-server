/**
 * Verification script: PATCH /api/payments/:id/status
 *
 * Tests:
 *  1. No token           → 401 Unauthorized
 *  2. Normal user token  → 403 Forbidden
 *  3. Invalid status     → 400 Invalid payment status
 *  4. Admin pays order   → 200, payment.paymentStatus === "paid",
 *                          order.orderStatus === "completed", order.paymentStatus === "paid"
 *  5. Wrong payment ID   → 404 Payment not found
 */
import "dotenv/config";
//# sourceMappingURL=verify-payment-status-sync.d.ts.map