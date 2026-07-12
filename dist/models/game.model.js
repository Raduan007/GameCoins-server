"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopUpPackageSchema = exports.GameSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.GameSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    collection: "games",
});
exports.GameSchema.index({ category: 1 });
exports.GameSchema.index({ isPopular: -1 });
exports.GameSchema.index({ isFeatured: -1 });
const Game = mongoose_1.default.models.Game || mongoose_1.default.model("Game", exports.GameSchema);
exports.default = Game;
exports.TopUpPackageSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    collection: "topup_packages",
});
exports.TopUpPackageSchema.index({ gameId: 1 });
//# sourceMappingURL=game.model.js.map