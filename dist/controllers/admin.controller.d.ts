import { Request, Response, NextFunction } from "express";
/**
 * GET /api/dashboard/admin/overview
 * Returns admin dashboard summary statistics and recent orders.
 */
export declare function getAdminOverview(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/dashboard/admin/users
 * Returns a paginated, searchable, sorted, and filtered list of users.
 */
export declare function getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/dashboard/admin/users/:id
 * Returns single user details, recent orders/payments, and wishlist count.
 */
export declare function getUserById(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * PATCH /api/dashboard/admin/users/:id/role
 * Updates a user's system role.
 */
export declare function updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * PATCH /api/dashboard/admin/users/:id/status
 * Disables or enables a user account.
 */
export declare function updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/dashboard/admin/games
 * Returns a paginated, filtered list of games.
 */
export declare function getAdminGames(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/dashboard/admin/games/:id
 */
export declare function getAdminGameById(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * POST /api/dashboard/admin/games
 */
export declare function createAdminGame(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * PATCH /api/dashboard/admin/games/:id
 */
export declare function updateAdminGame(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * DELETE /api/dashboard/admin/games/:id
 */
export declare function deleteAdminGame(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/dashboard/admin/packages
 */
export declare function getAdminPackages(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/dashboard/admin/packages/:id
 */
export declare function getAdminPackageById(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * POST /api/dashboard/admin/packages
 */
export declare function createAdminPackage(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * PATCH /api/dashboard/admin/packages/:id
 */
export declare function updateAdminPackage(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * DELETE /api/dashboard/admin/packages/:id
 */
export declare function deleteAdminPackage(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/dashboard/admin/orders
 * Returns paginated, searchable, filtered list of all orders.
 */
export declare function getAdminOrders(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/dashboard/admin/orders/:id
 * Returns full order details with all populated references.
 */
export declare function getAdminOrderById(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * PATCH /api/dashboard/admin/orders/:id/status
 * Allows admin to update an order's orderStatus.
 */
export declare function updateAdminOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map