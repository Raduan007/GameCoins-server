import mongoose, { Model } from "mongoose";
import type { IWishlist } from "../types/wishlist";
import { WishlistSchema } from "./wishlist.schema";

const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist || mongoose.model<IWishlist>("Wishlist", WishlistSchema);

export default Wishlist;
