"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const wishlist_schema_1 = require("./wishlist.schema");
const Wishlist = mongoose_1.default.models.Wishlist || mongoose_1.default.model("Wishlist", wishlist_schema_1.WishlistSchema);
exports.default = Wishlist;
//# sourceMappingURL=wishlist.model.js.map