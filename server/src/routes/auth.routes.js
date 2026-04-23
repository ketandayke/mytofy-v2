import { Router } from "express";
import { loginUser, logoutUser, registerUser, updateProfile, deleteProfile } from "../controllers/auth.controller.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(authLimiter, registerUser);
router.route("/login").post(authLimiter, loginUser);

// Secured routes
router.use(verifyJWT);
router.route("/logout").post(logoutUser);
router.route("/profile").put(updateProfile).delete(deleteProfile);

export default router;
