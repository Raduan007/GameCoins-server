import { Request, Response, NextFunction } from "express";
/**
 * POST /api/payments
 * Creates a pending payment record for an order owned by the user.
 */
export declare function createPayment(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/payments
 * Fetches the payment history for the logged-in user, sorted by newest first.
 * Populates order, and nested game and package details.
 */
export declare function getPayments(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=payment.controller.d.ts.map