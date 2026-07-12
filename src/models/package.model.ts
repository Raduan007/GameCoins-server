import mongoose, { Model, Schema } from "mongoose";
import type { IPackage } from "../types/package";

const PackageSchema = new Schema<IPackage>(
  {
    game: {
      type: Schema.Types.ObjectId,
      ref: "Game",
      required: [true, "Game reference is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Package name is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least 1"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0.01, "Price must be positive"],
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "packages",
  }
);

PackageSchema.index({ isPopular: -1 });
PackageSchema.index({ isActive: 1 });

const Package: Model<IPackage> =
  mongoose.models.Package ||
  mongoose.model<IPackage>("Package", PackageSchema);

export default Package;