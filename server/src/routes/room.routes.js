import { Router } from "express";
import { createRoom, getRoomDetails, getPublicRooms, joinRoom, searchRooms, getRecentRooms } from "../controllers/room.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protected routes
router.use(verifyJWT);

router.route("/").post(createRoom);
router.route("/public").get(getPublicRooms);
router.route("/search").get(searchRooms);
router.route("/recent").get(getRecentRooms);
router.route("/:roomId").get(getRoomDetails);
router.route("/:roomId/join").post(joinRoom);

export default router;
