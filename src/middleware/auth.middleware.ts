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
    console.log("Authorization Header:", authHeader);
   
   if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
  console.log("FAILED HERE: Authorization header missing");
  apiResponse.error(res, "Unauthorized", 401);
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
  apiResponse.error(res, "Unauthorized", 401);
  return;
}

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in the environment");
    }

    let decoded: DecodedToken;

try {
  decoded = jwt.verify(token, jwtSecret) as DecodedToken;
  console.log("Decoded JWT:", decoded);
} catch (error) {
  console.log("JWT Verify Error:", error);
  throw error;
}
    if (!decoded.userId || !decoded.email || !decoded.role) {
      apiResponse.error(res, "Unauthorized", 401);
      return;
    }if (!decoded.userId || !decoded.email || !decoded.role) {
  console.log("FAILED HERE: Payload missing", decoded);
  apiResponse.error(res, "Unauthorized", 401);
  return;
}
    console.log("Decoded Payload:", decoded);

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
