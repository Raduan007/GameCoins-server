import { Router } from "express";
import { getAdminOverview } from "../controllers/admin.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

router.get("/overview", authenticate, authorizeRoles("admin"), getAdminOverview);

export default router;
