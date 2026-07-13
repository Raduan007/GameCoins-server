import { Schema } from "mongoose";
import type { IWishlist } from "../types/wishlist";

export const WishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    game: {
      type: Schema.Types.ObjectId,
      ref: "Game",
      required: [true, "Game reference is required"],
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "wishlists",
  }
);
