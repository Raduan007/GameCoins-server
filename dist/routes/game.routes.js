"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const game_controller_1 = require("../controllers/game.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/", game_controller_1.getGames);
router.get("/featured", game_controller_1.getFeaturedGames);
router.get("/popular", game_controller_1.getPopularGames);
router.post("/", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)("admin"), game_controller_1.createGame);
router.get("/:slug", game_controller_1.getGameBySlug);
router.patch("/id/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)("admin"), game_controller_1.updateGame);
router.delete("/id/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)("admin"), game_controller_1.deleteGame);
exports.default = router;
//# sourceMappingURL=game.routes.js.map