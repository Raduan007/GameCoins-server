import { Request, Response, NextFunction } from "express";
import connectDB from "../config/db";
import apiResponse from "../utils/apiResponse";
import { ApiError, ApiErrors } from "../middleware/errorHandler";
import Package from "../models/package.model";
import type { IPackage } from "../types/package";

const REQUIRED_FIELDS = ["game", "name", "amount", "price"] as const;

const UPDATE_ALLOWED_FIELDS: (keyof IPackage)[] = [
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
export async function getPackages(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const packages = await Package.find({ isActive: true })
      .populate("game", "name slug logo category")
      .sort({ isPopular: -1, createdAt: -1 })
      .lean();

    apiResponse.success(res, packages, "Packages fetched successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/packages
 * Creates a new top-up package.
 */
export async function createPackage(
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

    const pkg = await Package.create(packageData);

    // Populate game info on the created document
    const populatedPkg = await Package.findById(pkg._id)
      .populate("game", "name slug logo category")
      .lean();

    apiResponse.success(res, populatedPkg, "Package created successfully", 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/packages/:id
 * Updates a top-up package. Only the provided fields are changed.
 */
export async function updatePackage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { id } = req.params;
    const body = req.body || {};

    // Build an update object using only the allowed keys present in the body
    const updateData: Partial<IPackage> = {};

    for (const field of UPDATE_ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // If no recognised fields were sent, return the existing package
    if (Object.keys(updateData).length === 0) {
      const pkg = await Package.findById(id)
        .populate("game", "name slug logo category")
        .lean();

      if (!pkg) {
        throw ApiErrors.notFound("Package");
      }

      apiResponse.success(
        res,
        pkg,
        "No fields to update; returning existing package"
      );
      return;
    }

    const result = await Package.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!result) {
      throw ApiErrors.notFound("Package");
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

    apiResponse.success(
      res,
      updatedPackage,
      "Package updated successfully"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/packages/:id
 * Permanently deletes a top-up package.
 */
export async function deletePackage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { id } = req.params;

    const deletedPackage = await Package.findByIdAndDelete(id).lean();

    if (!deletedPackage) {
      throw ApiErrors.notFound("Package");
    }

    apiResponse.success(res, null, "Package deleted successfully");
  } catch (error) {
    next(error);
  }
}
