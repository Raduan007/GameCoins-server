import mongoose, { Model, Schema } from "mongoose";
import type { IGame, ITopUpPackage } from "../types/game";

export const GameSchema = new Schema<IGame>(
  {
    name: {
      type: String,
      required: [true, "Game name is required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: [true, "Game slug is required"],
      trim: true,
      unique: true,
      lowercase: true,
    },
    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
    },
    fullDescription: {
      type: String,
      required: [true, "Full description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Game category is required"],
      trim: true,
    },
    platform: {
      type: String,
      required: [true, "Platform is required"],
      trim: true,
    },
    publisher: {
      type: String,
      required: [true, "Publisher is required"],
      trim: true,
    },
    logo: {
      type: String,
      required: [true, "Logo URL is required"],
    },
    banner: {
      type: String,
      required: [true, "Banner URL is required"],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
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
    collection: "games",
  }
);

GameSchema.index({ category: 1 });
GameSchema.index({ isPopular: -1 });
GameSchema.index({ isFeatured: -1 });

const Game: Model<IGame> =
  mongoose.models.Game || mongoose.model<IGame>("Game", GameSchema);

export default Game;

export const TopUpPackageSchema = new Schema<ITopUpPackage>(
  {
    gameId: {
      type: String,
      required: [true, "Game ID is required"],
    },
    name: {
      type: String,
      required: [true, "Package name is required"],
      trim: true,
    },
    coins: {
      type: Number,
      required: [true, "Coin amount is required"],
      min: [1, "Coins must be at least 1"],
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
    collection: "topup_packages",
  }
);

TopUpPackageSchema.index({ gameId: 1 });