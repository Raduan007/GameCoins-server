import { Request, Response, NextFunction } from "express";
import connectDB from "../config/db";
import apiResponse from "../utils/apiResponse";
import { ApiError, ApiErrors } from "../middleware/errorHandler";
import Game from "../models/game.model";
import Package from "../models/package.model";
import type { IGame } from "../types/game";

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
] as const;

const ALLOWED_FIELDS: (keyof IGame)[] = [
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
export async function getGames(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const search = req.query.search as string | undefined;
    const filter: any = { isActive: true };

    if (search && search.trim() !== "") {
      const regex = { $regex: search.trim(), $options: "i" };
      filter.$or = [
        { name: regex },
        { category: regex },
        { publisher: regex },
      ];
    }

    const games = await Game.find(filter)
      .sort({ isPopular: -1, createdAt: -1 })
      .lean();

    apiResponse.success(res, games, "Games fetched successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/games
 */
export async function createGame(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const body = req.body;

    // Validate required fields
    const missingFields = REQUIRED_FIELDS.filter((field) => {
      const value = body[field];
      return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      );
    });

    if (missingFields.length > 0) {
      throw new ApiError(
        `Missing required fields: ${missingFields.join(", ")}`,
        400
      );
    }

    // Check for duplicate slug
    const existingGame = await Game.findOne({
      slug: body.slug.trim().toLowerCase(),
    });
    if (existingGame) {
      throw new ApiError(
        `A game with the slug "${body.slug.trim().toLowerCase()}" already exists`,
        409
      );
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

    const game = await Game.create(gameData);

    apiResponse.success(res, game, "Game created successfully", 201);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/games/:slug
 */
export async function getGameBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { slug } = req.params;

    const game = await Game.findOne({ slug, isActive: true }).lean();

    if (!game) {
      throw ApiErrors.notFound("Game");
    }

    const packages = await Package.find({ game: game._id, isActive: true })
      .select("name amount price currency description isPopular")
      .sort({ price: 1 })
      .lean();

    apiResponse.success(
      res,
      { ...game, packages },
      "Game fetched successfully"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/games/id/:id
 */
export async function updateGame(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { id } = req.params;
    const body = req.body;

    // Build an update object using only the keys present in the request body
    const updateData: Partial<IGame> = {};

    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // If the client sent no recognised fields, bail early
    if (Object.keys(updateData).length === 0) {
      const game = await Game.findById(id).lean();
      if (!game) {
        throw ApiErrors.notFound("Game");
      }
      apiResponse.success(
        res,
        game,
        "No fields to update; returning existing game"
      );
      return;
    }

    const updatedGame = await Game.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedGame) {
      throw ApiErrors.notFound("Game");
    }

    apiResponse.success(res, updatedGame, "Game updated successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/games/id/:id
 */
export async function deleteGame(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { id } = req.params;

    const deletedGame = await Game.findByIdAndDelete(id).lean();

    if (!deletedGame) {
      throw ApiErrors.notFound("Game");
    }

    apiResponse.success(res, null, "Game deleted successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/games/featured
 * Returns only games where isFeatured is true and isActive is true.
 */
export async function getFeaturedGames(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const games = await Game.find({ isFeatured: true, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    if (!games || games.length === 0) {
      throw new ApiError("No featured games found", 404);
    }

    apiResponse.success(res, games, "Featured games fetched successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/games/popular
 * Returns only games where isPopular is true and isActive is true.
 */
export async function getPopularGames(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const games = await Game.find({ isPopular: true, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    if (!games || games.length === 0) {
      throw new ApiError("No popular games found", 404);
    }

    apiResponse.success(res, games, "Popular games fetched successfully");
  } catch (error) {
    next(error);
  }
}