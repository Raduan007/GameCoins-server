"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const apiResponse_1 = __importDefault(require("../utils/apiResponse"));
/**
 * JWT Authentication Middleware
 * Verifies the JWT from the Authorization header and attaches the user payload to req.user.
 */
function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            apiResponse_1.default.error(res, "Unauthorized", 401);
            return;
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            apiResponse_1.default.error(res, "Unauthorized", 401);
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined in the environment");
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (!decoded.userId || !decoded.email || !decoded.role) {
            apiResponse_1.default.error(res, "Unauthorized", 401);
            return;
        }
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError ||
            error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            apiResponse_1.default.error(res, "Unauthorized", 401);
            return;
        }
        next(error);
    }
}
//# sourceMappingURL=auth.middleware.js.map