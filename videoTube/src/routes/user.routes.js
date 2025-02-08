import express from "express";
import {
    changePassword,
    getChannel,
    getCurrentUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAvatar,
    updateCoverImage,
    updateFullNameAndEmail,
    getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRoutes = express.Router();

userRoutes.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser,
);

userRoutes.route("/login").post(loginUser);

// secured routes
userRoutes.route("/logout").post(verifyJWT, logoutUser);
userRoutes.route("/refresh-token").post(refreshAccessToken);
userRoutes.route("/change-password").post(verifyJWT, changePassword);
userRoutes.route("/getCurrent-user").patch(verifyJWT, getCurrentUser);
userRoutes
    .route("/update-fullname-and-email")
    .post(verifyJWT, updateFullNameAndEmail);
userRoutes
    .route("/update-avatar")
    .patch(verifyJWT, upload.single("avatar"), updateAvatar);
userRoutes
    .route("/update-coverImage")
    .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

userRoutes.route("/channel/:username").get(verifyJWT, getChannel);
userRoutes.route("/watchHistory").get(verifyJWT, getWatchHistory);

export default userRoutes;
