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
//# sourceMappingURL=auth.controller.d.ts.map