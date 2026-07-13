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
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getGames);
router.get("/featured", getFeaturedGames);
router.get("/popular", getPopularGames);
router.post("/", authenticate, authorizeRoles("admin"), createGame);
router.get("/:slug", getGameBySlug);
router.patch("/id/:id", authenticate, authorizeRoles("admin"), updateGame);
router.delete("/id/:id", authenticate, authorizeRoles("admin"), deleteGame);

export default router;