import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connectDB from "../config/db";
import apiResponse from "../utils/apiResponse";
import { ApiError, ApiErrors } from "../middleware/errorHandler";
import User from "../models/user.model";

const REQUIRED_FIELDS = ["name", "email", "password"] as const;

const LOGIN_REQUIRED_FIELDS = ["email", "password"] as const;

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

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await User.create({
      name: body.name.trim(),
      email,
      password: hashedPassword,
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

/**
 * POST /api/auth/login
 * Logs in an existing user.
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const body = req.body;

    // Validate required fields
    const missingFields = LOGIN_REQUIRED_FIELDS.filter((field) => {
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
    const password = body.password;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError("Invalid email or password", 401);
    }

    // Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError("Invalid email or password", 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in the environment");
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id ? user._id.toString() : "",
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    // Exclude password from the response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const responseData = {
      token,
      user: userResponse,
    };

    apiResponse.success(res, responseData, "Login successful");
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Retrieves the current authenticated user's profile.
 */
export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    if (!req.user || !req.user.userId) {
      throw new ApiError("Unauthorized", 401);
    }

    const user = await User.findById(req.user.userId).lean();

    if (!user) {
      throw ApiErrors.notFound("User");
    }

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

    apiResponse.success(res, responseData, "User fetched successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/google
 * Authenticates or registers a user via Google ID Token.
 */
export async function googleLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();
    const { idToken } = req.body;
    if (!idToken) {
      throw new ApiError("Google ID token is required", 400);
    }

    // Verify token with Google's API
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!googleRes.ok) {
      throw new ApiError("Invalid Google ID token", 401);
    }
    const payload: any = await googleRes.json();

    // Validate client ID matches
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      throw new Error("GOOGLE_CLIENT_ID is not defined in the environment");
    }
    if (payload.aud !== googleClientId) {
      throw new ApiError("Invalid Google client ID audience mismatch", 401);
    }

    const email = payload.email.trim().toLowerCase();
    const name = payload.name || payload.given_name || "Google User";
    const avatar = payload.picture || "";

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      // Create user with a secure randomized password since passwords are required in schema
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
      user = await User.create({
        name,
        email,
        password: randomPassword,
        role: "user",
        avatar,
        isActive: true,
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in the environment");
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id ? user._id.toString() : "",
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const responseData = {
      token,
      user: userResponse,
    };

    apiResponse.success(res, responseData, "Google login successful");
  } catch (error) {
    next(error);
  }
}

