import express, { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getTotalLikeOnComment,
    getTotalLikeOnVideo,
    toggleCommentLike,
    togglevideoLike,
} from "../controllers/like.controller.js";

const likeRoutes = express.Router();

likeRoutes.route("/toggleVideoLike/:videoId").post(verifyJWT, togglevideoLike);
likeRoutes
    .route("/toggleCommentLike/:commentId")
    .post(verifyJWT, toggleCommentLike);

likeRoutes.route("/totalLikeOnComment/:commentId").get(getTotalLikeOnComment);
likeRoutes.route("/totalLikeOnVideo/:videoId").get(getTotalLikeOnVideo);

export default likeRoutes;
