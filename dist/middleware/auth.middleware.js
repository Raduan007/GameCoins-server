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
        console.log("Authorization Header:", authHeader);
        if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
            console.log("FAILED HERE: Authorization header missing");
            apiResponse_1.default.error(res, "Unauthorized", 401);
            return;
        }
        let token = authHeader.slice(7).trim();
        // Strip redundant Bearer prefix if nested (common client misconfiguration)
        if (token.toLowerCase().startsWith("bearer ")) {
            token = token.slice(7).trim();
        }
        // Strip surrounding quotes if copied incorrectly
        if (token.startsWith('"') && token.endsWith('"')) {
            token = token.slice(1, -1);
        }
        if (!token) {
            console.log("FAILED HERE: Token empty");
            apiResponse_1.default.error(res, "Unauthorized", 401);
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined in the environment");
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            console.log("Decoded JWT:", decoded);
        }
        catch (error) {
            console.log("JWT Verify Error:", error);
            throw error;
        }
        if (!decoded.userId || !decoded.email || !decoded.role) {
            apiResponse_1.default.error(res, "Unauthorized", 401);
            return;
        }
        if (!decoded.userId || !decoded.email || !decoded.role) {
            console.log("FAILED HERE: Payload missing", decoded);
            apiResponse_1.default.error(res, "Unauthorized", 401);
            return;
        }
        console.log("Decoded Payload:", decoded);
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