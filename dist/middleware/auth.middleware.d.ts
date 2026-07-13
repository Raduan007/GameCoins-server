import { Request, Response, NextFunction } from "express";
/**
 * JWT Authentication Middleware
 * Verifies the JWT from the Authorization header and attaches the user payload to req.user.
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
/**
 * Role authorization middleware
 * Checks if the authenticated user has one of the allowed roles.
 */
export declare function authorizeRoles(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map