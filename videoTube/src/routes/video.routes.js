import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    deleteVideo,
    getAllVideos,
    getParticularVideo,
    updateVideoDetails,
    uploadVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const videoRouter = express.Router();

videoRouter.route("/").get(getAllVideos);

videoRouter.route("/:videoId").get(getParticularVideo);

videoRouter.route("/upload").post(
    verifyJWT,
    upload.fields([
        {
            name: "video",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    uploadVideo,
);

videoRouter.route("/delete/:videoId").delete(verifyJWT, deleteVideo);

videoRouter
    .route("/update/:videoId")
    .patch(verifyJWT, upload.single("thumbnail"), updateVideoDetails);

export default videoRouter;
