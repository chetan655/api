import express from "express";
import {
    addComment,
    deleteComment,
    getVideoComment,
    updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const commentRoutes = express.Router();

commentRoutes.route("/getComments/:videoId").get(getVideoComment);

commentRoutes.route("/addComment/:videoId").post(verifyJWT, addComment);
commentRoutes
    .route("/deleteComment/:commentId")
    .delete(verifyJWT, deleteComment);
commentRoutes.route("/updateComment/:commentId").post(verifyJWT, updateComment);

export default commentRoutes;
