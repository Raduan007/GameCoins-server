import type { Types } from "mongoose";
export interface IWishlist {
    _id?: string;
    user: Types.ObjectId | string;
    game: Types.ObjectId | string;
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=wishlist.d.ts.map