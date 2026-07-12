import { Request, Response, NextFunction } from "express";
/**
 * GET /api/packages
 * Returns all active packages, populated with their game reference.
 */
export declare function getPackages(_req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * POST /api/packages
 * Creates a new top-up package.
 */
export declare function createPackage(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * PATCH /api/packages/:id
 * Updates a top-up package. Only the provided fields are changed.
 */
export declare function updatePackage(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * DELETE /api/packages/:id
 * Permanently deletes a top-up package.
 */
export declare function deletePackage(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=package.controller.d.ts.map