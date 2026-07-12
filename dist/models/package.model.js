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
const mongoose_1 = __importStar(require("mongoose"));
const PackageSchema = new mongoose_1.Schema({
    game: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
    collection: "packages",
});
PackageSchema.index({ isPopular: -1 });
PackageSchema.index({ isActive: 1 });
const Package = mongoose_1.default.models.Package ||
    mongoose_1.default.model("Package", PackageSchema);
exports.default = Package;
//# sourceMappingURL=package.model.js.map