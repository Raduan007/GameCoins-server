import { Request, Response, NextFunction } from "express";
/**
 * GET /api/dashboard/overview
 * Returns dashboard summary metrics for the logged-in user.
 */
export declare function getDashboardOverview(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/dashboard/orders
 * Returns all orders belonging to the logged-in user.
 * Populates game and package details.
 * Sorted by newest first.
 */
export declare function getBuyerOrders(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=dashboard.controller.d.ts.map