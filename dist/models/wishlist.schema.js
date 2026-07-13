"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WishlistSchema = void 0;
const mongoose_1 = require("mongoose");
exports.WishlistSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User reference is required"],
        index: true,
    },
    game: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Game",
        required: [true, "Game reference is required"],
        index: true,
    },
}, {
    timestamps: true,
    collection: "wishlists",
});
//# sourceMappingURL=wishlist.schema.js.map