import { Request, Response, NextFunction } from "express";
/**
 * GET /api/games
 */
export declare function getGames(_req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * POST /api/games
 */
export declare function createGame(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/games/:slug
 */
export declare function getGameBySlug(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * PATCH /api/games/id/:id
 */
export declare function updateGame(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * DELETE /api/games/id/:id
 */
export declare function deleteGame(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=game.controller.d.ts.map