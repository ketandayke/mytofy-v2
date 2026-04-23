import { Router } from "express";
import { searchSongs } from "../controllers/youtube.controller.js";
import { globalLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// Route: /api/v1/youtube/search?q=query
router.route("/search").get(globalLimiter, searchSongs);

export default router;
