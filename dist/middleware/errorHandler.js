"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiErrors = exports.ApiError = void 0;
exports.errorHandler = errorHandler;
const mongoose_1 = require("mongoose");
const apiResponse_1 = __importDefault(require("../utils/apiResponse"));
/**
 * Custom error class for API errors with status codes.
 */
class ApiError extends Error {
    status;
    constructor(message, status = 400) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}
exports.ApiError = ApiError;
/**
 * Common API errors factory.
 */
exports.ApiErrors = {
    notFound: (resource = "Resource") => new ApiError(`${resource} not found`, 404),
    badRequest: (message) => new ApiError(message, 400),
    unauthorized: (message = "Unauthorized") => new ApiError(message, 401),
    forbidden: (message = "Forbidden") => new ApiError(message, 403),
    internal: (message = "Internal server error") => new ApiError(message, 500),
};
function isMongoDuplicateError(error) {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000);
}
/**
 * Centralized error handler middleware for Express.
 */
function errorHandler(error, _req, res, _next) {
    // Log all errors to the terminal during development
    if (process.env.NODE_ENV !== "production") {
        console.error("[API Error]", error);
    }
    // Mongoose validation error — return 400 with field-level messages
    if (error instanceof mongoose_1.Error.ValidationError) {
        const messages = Object.values(error.errors).map((e) => e.message);
        apiResponse_1.default.error(res, messages.join(", "), 400);
        return;
    }
    // MongoDB duplicate key error
    if (isMongoDuplicateError(error)) {
        const field = Object.keys(error.keyPattern || {}).join(", ");
        apiResponse_1.default.error(res, `Duplicate value for: ${field}`, 409);
        return;
    }
    if (error instanceof ApiError) {
        apiResponse_1.default.error(res, error.message, error.status);
        return;
    }
    if (error instanceof Error) {
        const message = process.env.NODE_ENV !== "production"
            ? error.message
            : "An unexpected error occurred";
        apiResponse_1.default.error(res, message, 500);
        return;
    }
    apiResponse_1.default.error(res, "An unexpected error occurred", 500);
}
//# sourceMappingURL=errorHandler.js.map