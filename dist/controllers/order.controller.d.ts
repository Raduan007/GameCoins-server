import { Request, Response, NextFunction } from "express";
/**
 * POST /api/orders
 * Creates a new order for a game package.
 */
export declare function createOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/orders
 * Fetches the order history for the logged-in user, sorted by newest first.
 * Populates game and package details.
 */
export declare function getOrders(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/orders/:id
 * Fetches details for a specific order.
 * Populates user (name, email), game, and package.
 * Restricts access to the order owner or an admin.
 */
export declare function getOrderById(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=order.controller.d.ts.map