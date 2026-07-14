import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
import apiResponse from "../utils/apiResponse";

/**
 * Custom error class for API errors with status codes.
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Common API errors factory.
 */
export const ApiErrors = {
  notFound: (resource = "Resource") => new ApiError(`${resource} not found`, 404),
  badRequest: (message: string) => new ApiError(message, 400),
  unauthorized: (message = "Unauthorized") => new ApiError(message, 401),
  forbidden: (message = "Forbidden") => new ApiError(message, 403),
  internal: (message = "Internal server error") => new ApiError(message, 500),
};

function isMongoDuplicateError(
  error: unknown
): error is { code: number; keyPattern: Record<string, unknown> } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

/**
 * Centralized error handler middleware for Express.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Always log the full error — critical for diagnosing production failures on Render
  console.error("[API Error]", error);
  if (error instanceof Error) {
    console.error(error.stack);
  }

  // Mongoose validation error — return 400 with field-level messages
  if (error instanceof MongooseError.ValidationError) {
    const messages = Object.values(error.errors).map((e) => e.message);
    apiResponse.error(res, messages.join(", "), 400);
    return;
  }

  // MongoDB duplicate key error
  if (isMongoDuplicateError(error)) {
    const field = Object.keys(error.keyPattern || {}).join(", ");
    apiResponse.error(res, `Duplicate value for: ${field}`, 409);
    return;
  }

  if (error instanceof ApiError) {
    apiResponse.error(res, error.message, error.status);
    return;
  }

  if (error instanceof Error) {
    const message =
      process.env.NODE_ENV !== "production"
        ? error.message
        : "An unexpected error occurred";
    apiResponse.error(res, message, 500);
    return;
  }

  apiResponse.error(res, "An unexpected error occurred", 500);
}