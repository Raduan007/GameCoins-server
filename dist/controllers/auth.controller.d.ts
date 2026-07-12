import { Request, Response, NextFunction } from "express";
/**
 * POST /api/auth/register
 * Registers a new user.
 */
export declare function register(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * POST /api/auth/login
 * Logs in an existing user.
 */
export declare function login(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/auth/me
 * Retrieves the current authenticated user's profile.
 */
export declare function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map