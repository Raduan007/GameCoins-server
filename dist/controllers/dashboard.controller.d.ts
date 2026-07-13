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
/**
 * GET /api/dashboard/orders/:id
 * Returns a specific order details for the logged-in user if they own it.
 * Populates game and package details.
 */
export declare function getBuyerOrderById(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/dashboard/payments
 * Returns all payments belonging to the logged-in user.
 * Populates order details, and nested game and package details.
 * Sorted by newest first.
 */
export declare function getBuyerPayments(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/dashboard/wishlist
 * Returns wishlist items for the logged-in user.
 * Populates game details.
 * Sorted by newest first.
 */
export declare function getBuyerWishlist(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * POST /api/dashboard/wishlist
 * Adds a game to the logged-in user's wishlist.
 */
export declare function addToWishlist(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * DELETE /api/dashboard/wishlist/:id
 * Removes a game from the logged-in user's wishlist.
 */
export declare function removeFromWishlist(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/dashboard/profile
 * Returns the logged-in user's profile details.
 * Excludes sensitive fields like password.
 */
export declare function getBuyerProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * PATCH /api/dashboard/profile
 * Updates the logged-in user's profile name.
 * Disallows updating email, role, or status/isActive.
 */
export declare function updateBuyerProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=dashboard.controller.d.ts.map