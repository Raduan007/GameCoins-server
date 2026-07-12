import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import apiResponse from "../utils/apiResponse";

interface DecodedToken {
  userId: string;
  email: string;
  role: "user" | "admin";
}

/**
 * JWT Authentication Middleware
 * Verifies the JWT from the Authorization header and attaches the user payload to req.user.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      apiResponse.error(res, "Unauthorized", 401);
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      apiResponse.error(res, "Unauthorized", 401);
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in the environment");
    }

    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

    if (!decoded.userId || !decoded.email || !decoded.role) {
      apiResponse.error(res, "Unauthorized", 401);
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      apiResponse.error(res, "Unauthorized", 401);
      return;
    }
    next(error);
  }
}
