"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getCurrentUser = getCurrentUser;
exports.googleLogin = googleLogin;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const apiResponse_1 = __importDefault(require("../utils/apiResponse"));
const errorHandler_1 = require("../middleware/errorHandler");
const user_model_1 = __importDefault(require("../models/user.model"));
const REQUIRED_FIELDS = ["name", "email", "password"];
const LOGIN_REQUIRED_FIELDS = ["email", "password"];
/**
 * POST /api/auth/register
 * Registers a new user.
 */
async function register(req, res, next) {
    try {
        await (0, db_1.default)();
        const body = req.body;
        // Validate required fields
        const missingFields = REQUIRED_FIELDS.filter((field) => {
            const value = body[field];
            return (value === undefined ||
                value === null ||
                (typeof value === "string" && value.trim() === ""));
        });
        if (missingFields.length > 0) {
            throw new errorHandler_1.ApiError(`Missing required fields: ${missingFields.join(", ")}`, 400);
        }
        const email = body.email.trim().toLowerCase();
        // Check for existing user
        const existingUser = await user_model_1.default.findOne({ email }).lean();
        if (existingUser) {
            throw new errorHandler_1.ApiError("A user with this email already exists", 409);
        }
        const hashedPassword = await bcrypt_1.default.hash(body.password, 10);
        const user = await user_model_1.default.create({
            name: body.name.trim(),
            email,
            password: hashedPassword,
            role: "user",
            avatar: "",
            isActive: true,
            status: "active",
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
        apiResponse_1.default.success(res, responseData, "User registered successfully", 201);
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/auth/login
 * Logs in an existing user.
 */
async function login(req, res, next) {
    try {
        await (0, db_1.default)();
        const body = req.body;
        // Validate required fields
        const missingFields = LOGIN_REQUIRED_FIELDS.filter((field) => {
            const value = body[field];
            return (value === undefined ||
                value === null ||
                (typeof value === "string" && value.trim() === ""));
        });
        if (missingFields.length > 0) {
            throw new errorHandler_1.ApiError(`Missing required fields: ${missingFields.join(", ")}`, 400);
        }
        const email = body.email.trim().toLowerCase();
        const password = body.password;
        // Find user by email
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            throw new errorHandler_1.ApiError("Invalid email or password", 401);
        }
        if (user.status === "suspended" || user.status === "blocked") {
            throw new errorHandler_1.ApiError(`Your account has been ${user.status}. Please contact support.`, 403);
        }
        // Compare password using bcrypt
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            throw new errorHandler_1.ApiError("Invalid email or password", 401);
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined in the environment");
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user._id ? user._id.toString() : "",
            email: user.email,
            role: user.role,
        }, jwtSecret, { expiresIn: "7d" });
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
        apiResponse_1.default.success(res, responseData, "Login successful");
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/auth/me
 * Retrieves the current authenticated user's profile.
 */
async function getCurrentUser(req, res, next) {
    try {
        await (0, db_1.default)();
        if (!req.user || !req.user.userId) {
            throw new errorHandler_1.ApiError("Unauthorized", 401);
        }
        const user = await user_model_1.default.findById(req.user.userId).lean();
        if (!user) {
            throw errorHandler_1.ApiErrors.notFound("User");
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
        apiResponse_1.default.success(res, responseData, "User fetched successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/auth/google
 * Authenticates or registers a user via Google ID Token.
 */
async function googleLogin(req, res, next) {
    try {
        await (0, db_1.default)();
        const { idToken } = req.body;
        if (!idToken) {
            throw new errorHandler_1.ApiError("Google ID token is required", 400);
        }
        // Verify token with Google's API
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!googleRes.ok) {
            throw new errorHandler_1.ApiError("Invalid Google ID token", 401);
        }
        const payload = await googleRes.json();
        // Validate client ID matches
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        if (!googleClientId) {
            throw new Error("GOOGLE_CLIENT_ID is not defined in the environment");
        }
        if (payload.aud !== googleClientId) {
            throw new errorHandler_1.ApiError("Invalid Google client ID audience mismatch", 401);
        }
        const email = payload.email.trim().toLowerCase();
        const name = payload.name || payload.given_name || "Google User";
        const avatar = payload.picture || "";
        // Find or create user
        let user = await user_model_1.default.findOne({ email });
        if (!user) {
            // Create user with a secure randomized password since passwords are required in schema
            const randomPassword = await bcrypt_1.default.hash(Math.random().toString(36).slice(-10), 10);
            user = await user_model_1.default.create({
                name,
                email,
                password: randomPassword,
                role: "user",
                avatar,
                isActive: true,
                status: "active",
            });
        }
        if (user.status === "suspended" || user.status === "blocked") {
            throw new errorHandler_1.ApiError(`Your account has been ${user.status}. Please contact support.`, 403);
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined in the environment");
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user._id ? user._id.toString() : "",
            email: user.email,
            role: user.role,
        }, jwtSecret, { expiresIn: "7d" });
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
        apiResponse_1.default.success(res, responseData, "Google login successful");
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=auth.controller.js.map