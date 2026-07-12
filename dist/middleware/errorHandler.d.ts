import { Request, Response, NextFunction } from "express";
/**
 * Custom error class for API errors with status codes.
 */
export declare class ApiError extends Error {
    status: number;
    constructor(message: string, status?: number);
}
/**
 * Common API errors factory.
 */
export declare const ApiErrors: {
    notFound: (resource?: string) => ApiError;
    badRequest: (message: string) => ApiError;
    unauthorized: (message?: string) => ApiError;
    forbidden: (message?: string) => ApiError;
    internal: (message?: string) => ApiError;
};
/**
 * Centralized error handler middleware for Express.
 */
export declare function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map