"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGames = getGames;
exports.createGame = createGame;
exports.getGameBySlug = getGameBySlug;
exports.updateGame = updateGame;
exports.deleteGame = deleteGame;
exports.getFeaturedGames = getFeaturedGames;
exports.getPopularGames = getPopularGames;
const db_1 = __importDefault(require("../config/db"));
const apiResponse_1 = __importDefault(require("../utils/apiResponse"));
const errorHandler_1 = require("../middleware/errorHandler");
const game_model_1 = __importDefault(require("../models/game.model"));
const package_model_1 = __importDefault(require("../models/package.model"));
const REQUIRED_FIELDS = [
    "name",
    "slug",
    "shortDescription",
    "fullDescription",
    "category",
    "platform",
    "publisher",
    "logo",
    "banner",
];
const ALLOWED_FIELDS = [
    "name",
    "slug",
    "shortDescription",
    "fullDescription",
    "category",
    "platform",
    "publisher",
    "logo",
    "banner",
    "rating",
    "isPopular",
    "isFeatured",
    "isActive",
];
/**
 * GET /api/games
 */
async function getGames(_req, res, next) {
    try {
        await (0, db_1.default)();
        const games = await game_model_1.default.find({ isActive: true })
            .sort({ isPopular: -1, createdAt: -1 })
            .lean();
        apiResponse_1.default.success(res, games, "Games fetched successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/games
 */
async function createGame(req, res, next) {
    try {
        await (0, db_1.default)();
        const body = req.body;
        // Validate required fields
        const missingFields = REQUIRED_FIELDS.filter((field) => {
            const value = body[field];
            return (value === undefined ||
                value === null ||
                (typeof value === "string" && value.trim() === ""));
        });
        if (missingFields.length > 0) {
            throw new errorHandler_1.ApiError(`Missing required fields: ${missingFields.join(", ")}`, 400);
        }
        // Check for duplicate slug
        const existingGame = await game_model_1.default.findOne({
            slug: body.slug.trim().toLowerCase(),
        });
        if (existingGame) {
            throw new errorHandler_1.ApiError(`A game with the slug "${body.slug.trim().toLowerCase()}" already exists`, 409);
        }
        // Build game data with trimmed strings
        const gameData = {
            name: body.name.trim(),
            slug: body.slug.trim().toLowerCase(),
            shortDescription: body.shortDescription.trim(),
            fullDescription: body.fullDescription.trim(),
            category: body.category.trim(),
            platform: body.platform.trim(),
            publisher: body.publisher.trim(),
            logo: body.logo.trim(),
            banner: body.banner.trim(),
            rating: typeof body.rating === "number" ? body.rating : 0,
            isPopular: Boolean(body.isPopular),
            isFeatured: Boolean(body.isFeatured),
            isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        };
        const game = await game_model_1.default.create(gameData);
        apiResponse_1.default.success(res, game, "Game created successfully", 201);
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/games/:slug
 */
async function getGameBySlug(req, res, next) {
    try {
        await (0, db_1.default)();
        const { slug } = req.params;
        const game = await game_model_1.default.findOne({ slug, isActive: true }).lean();
        if (!game) {
            throw errorHandler_1.ApiErrors.notFound("Game");
        }
        const packages = await package_model_1.default.find({ game: game._id, isActive: true })
            .select("name amount price currency description isPopular")
            .sort({ price: 1 })
            .lean();
        apiResponse_1.default.success(res, { ...game, packages }, "Game fetched successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/games/id/:id
 */
async function updateGame(req, res, next) {
    try {
        await (0, db_1.default)();
        const { id } = req.params;
        const body = req.body;
        // Build an update object using only the keys present in the request body
        const updateData = {};
        for (const field of ALLOWED_FIELDS) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }
        // If the client sent no recognised fields, bail early
        if (Object.keys(updateData).length === 0) {
            const game = await game_model_1.default.findById(id).lean();
            if (!game) {
                throw errorHandler_1.ApiErrors.notFound("Game");
            }
            apiResponse_1.default.success(res, game, "No fields to update; returning existing game");
            return;
        }
        const updatedGame = await game_model_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).lean();
        if (!updatedGame) {
            throw errorHandler_1.ApiErrors.notFound("Game");
        }
        apiResponse_1.default.success(res, updatedGame, "Game updated successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/games/id/:id
 */
async function deleteGame(req, res, next) {
    try {
        await (0, db_1.default)();
        const { id } = req.params;
        const deletedGame = await game_model_1.default.findByIdAndDelete(id).lean();
        if (!deletedGame) {
            throw errorHandler_1.ApiErrors.notFound("Game");
        }
        apiResponse_1.default.success(res, null, "Game deleted successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/games/featured
 * Returns only games where isFeatured is true and isActive is true.
 */
async function getFeaturedGames(_req, res, next) {
    try {
        await (0, db_1.default)();
        const games = await game_model_1.default.find({ isFeatured: true, isActive: true })
            .sort({ createdAt: -1 })
            .lean();
        if (!games || games.length === 0) {
            throw new errorHandler_1.ApiError("No featured games found", 404);
        }
        apiResponse_1.default.success(res, games, "Featured games fetched successfully");
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/games/popular
 * Returns only games where isPopular is true and isActive is true.
 */
async function getPopularGames(_req, res, next) {
    try {
        await (0, db_1.default)();
        const games = await game_model_1.default.find({ isPopular: true, isActive: true })
            .sort({ createdAt: -1 })
            .lean();
        if (!games || games.length === 0) {
            throw new errorHandler_1.ApiError("No popular games found", 404);
        }
        apiResponse_1.default.success(res, games, "Popular games fetched successfully");
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=game.controller.js.map