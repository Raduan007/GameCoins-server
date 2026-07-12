import { Router } from "express";
import {
  getGames,
  createGame,
  getGameBySlug,
  updateGame,
  deleteGame,
} from "../controllers/game.controller";

const router = Router();

router.get("/", getGames);
router.post("/", createGame);
router.get("/:slug", getGameBySlug);
router.patch("/id/:id", updateGame);
router.delete("/id/:id", deleteGame);

export default router;