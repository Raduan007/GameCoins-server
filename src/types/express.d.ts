import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: "user" | "admin" | "seller";
      };
    }
  }
}
