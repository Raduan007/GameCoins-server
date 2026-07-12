import { Router } from "express";
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
} from "../controllers/package.controller";

const router = Router();

router.get("/", getPackages);
router.post("/", createPackage);
router.patch("/:id", updatePackage);
router.delete("/:id", deletePackage);

export default router;