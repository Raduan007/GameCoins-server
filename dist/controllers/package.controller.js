"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackages = getPackages;
exports.createPackage = createPackage;
exports.updatePackage = updatePackage;
exports.deletePackage = deletePackage;
const db_1 = __importDefault(require("../config/db"));
const apiResponse_1 = __importDefault(require("../utils/apiResponse"));
const errorHandler_1 = require("../middleware/errorHandler");
const package_model_1 = __importDefault(require("../models/package.model"));
const REQUIRED_FIELDS = ["game", "name", "amount", "price"];
const UPDATE_ALLOWED_FIELDS = [
    "name",
    "amount",
    "price",
    "currency",
    "description",
    "isPopular",
    "isActive",
];
/**
 * GET /api/packages
 * Returns all active packages, populated with their game reference.
 */
async function getPackages(_req, res, next) {
    try {
        await (0, db_1.default)();
        const packages = await package_model_1.default.find({ isActive: true })
            .populate("game", "name slug logo category")
            .sort({ isPopular: -1, createdAt: -1 })
            .lean();
        apiResponse_1.default.success(res, packages, "Packages fetched successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/packages
 * Creates a new top-up package.
 */
async function createPackage(req, res, next) {
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
        // Build package data
        const packageData = {
            game: body.game,
            name: body.name.trim(),
            amount: Number(body.amount),
            price: Number(body.price),
            currency: body.currency ? body.currency.trim().toUpperCase() : "USD",
            description: body.description ? body.description.trim() : "",
            isPopular: Boolean(body.isPopular),
            isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        };
        const pkg = await package_model_1.default.create(packageData);
        // Populate game info on the created document
        const populatedPkg = await package_model_1.default.findById(pkg._id)
            .populate("game", "name slug logo category")
            .lean();
        apiResponse_1.default.success(res, populatedPkg, "Package created successfully", 201);
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/packages/:id
 * Updates a top-up package. Only the provided fields are changed.
 */
async function updatePackage(req, res, next) {
    try {
        await (0, db_1.default)();
        const { id } = req.params;
        const body = req.body || {};
        // Build an update object using only the allowed keys present in the body
        const updateData = {};
        for (const field of UPDATE_ALLOWED_FIELDS) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }
        // If no recognised fields were sent, return the existing package
        if (Object.keys(updateData).length === 0) {
            const pkg = await package_model_1.default.findById(id)
                .populate("game", "name slug logo category")
                .lean();
            if (!pkg) {
                throw errorHandler_1.ApiErrors.notFound("Package");
            }
            apiResponse_1.default.success(res, pkg, "No fields to update; returning existing package");
            return;
        }
        const result = await package_model_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
        if (!result) {
            throw errorHandler_1.ApiErrors.notFound("Package");
        }
        // Use .get() to read raw document values without triggering
        // Mongoose internal getter / population resolution on the game ref.
        const updatedPackage = {
            _id: result._id,
            game: result.get("game"),
            name: result.get("name"),
            amount: result.get("amount"),
            price: result.get("price"),
            currency: result.get("currency"),
            description: result.get("description"),
            isPopular: result.get("isPopular"),
            isActive: result.get("isActive"),
            createdAt: result.get("createdAt"),
            updatedAt: result.get("updatedAt"),
        };
        apiResponse_1.default.success(res, updatedPackage, "Package updated successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/packages/:id
 * Permanently deletes a top-up package.
 */
async function deletePackage(req, res, next) {
    try {
        await (0, db_1.default)();
        const { id } = req.params;
        const deletedPackage = await package_model_1.default.findByIdAndDelete(id).lean();
        if (!deletedPackage) {
            throw errorHandler_1.ApiErrors.notFound("Package");
        }
        apiResponse_1.default.success(res, null, "Package deleted successfully");
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=package.controller.js.map