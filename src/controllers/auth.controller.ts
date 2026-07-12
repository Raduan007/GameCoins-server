import { Request, Response, NextFunction } from "express";
import connectDB from "../config/db";
import apiResponse from "../utils/apiResponse";
import { ApiError } from "../middleware/errorHandler";
import User from "../models/user.model";

const REQUIRED_FIELDS = ["name", "email", "password"] as const;

/**
 * POST /api/auth/register
 * Registers a new user.
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const body = req.body;

    // Validate required fields
    const missingFields = REQUIRED_FIELDS.filter((field) => {
      const value = body[field];
      return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      );
    });

    if (missingFields.length > 0) {
      throw new ApiError(
        `Missing required fields: ${missingFields.join(", ")}`,
        400
      );
    }

    const email = body.email.trim().toLowerCase();

    // Check for existing user
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      throw new ApiError("A user with this email already exists", 409);
    }

    const user = await User.create({
      name: body.name.trim(),
      email,
      password: body.password,
      role: "user",
      avatar: "",
      isActive: true,
    });

    // Exclude password from the response
    const responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    apiResponse.success(res, responseData, "User registered successfully", 201);
  } catch (error) {
    next(error);
  }
}