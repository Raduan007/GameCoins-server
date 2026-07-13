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
//# sourceMappingURL=admin.controller.d.ts.map