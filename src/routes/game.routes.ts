import { Router } from "express";
import {
  getGames,
  createGame,
  getGameBySlug,
  updateGame,
  deleteGame,
  getFeaturedGames,
  getPopularGames,
} from "../controllers/game.controller";

const router = Router();

router.get("/", getGames);
router.get("/featured", getFeaturedGames);
router.get("/popular", getPopularGames);
router.post("/", createGame);
router.get("/:slug", getGameBySlug);
router.patch("/id/:id", updateGame);
router.delete("/id/:id", deleteGame);

export default router;