import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Like from "../models/like.model.js";

// ----------------------------------------toggle video like controller-------------------------------
const togglevideoLike = asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;
    const userId = req?.user?._id;

    if (!videoId) return next(new ApiError(400, "Video is required."));
    if (!userId)
        return next(new ApiError(400, "Please login to like a video."));

    if (!isValidObjectId(videoId))
        return next(new ApiError(400, "Invalid video id."));

    const videoObjectId = new mongoose.Types.ObjectId(videoId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const unlikeVideo = await Like.findOneAndDelete({
        video: videoObjectId,
        likedBy: userObjectId,
    });

    if (unlikeVideo) {
        return res.status(200).json({
            success: true,
            message: "Video unliked successfully.",
            unlikeVideo,
        });
    }

    const newLikedVideo = await Like.create({
        video: videoObjectId,
        likedBy: userObjectId,
    });

    if (!newLikedVideo) return next(new ApiError(500, "Unable to like video."));

    return res.status(200).json({
        success: true,
        message: "Video liked successfully.",
        newLikedVideo,
    });
});

// ----------------------------------------comment like controller-----------------------------------
const toggleCommentLike = asyncHandler(async (req, res, next) => {
    const { commentId } = req.params;
    const userId = req?.user?._id;

    if (!commentId)
        return next(new ApiError(400, "Comment is required to like."));

    if (!isValidObjectId(commentId))
        return next(new ApiError(400, "Invalid comment id."));

    if (!userId)
        return next(new ApiError(400, "Please login to like a comment."));

    const commentObjectId = new mongoose.Types.ObjectId(commentId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const unlikeComment = await Like.findOneAndDelete({
        comment: commentObjectId,
        likedBy: userObjectId,
    });

    if (unlikeComment) {
        return res.status(200).json({
            success: true,
            message: "Comment unliked successfully.",
            unlikeComment,
        });
    }

    const newCommentLike = await Like.create({
        comment: commentObjectId,
        likedBy: userObjectId,
    });

    if (!newCommentLike)
        return next(new ApiError(500, "Unable to like comment."));

    return res.status(200).json({
        success: true,
        message: "Comment liked successfully.",
        newCommentLike,
    });
});

// ---------------------------------------get total likes on a comment------------------------------
const getTotalLikeOnComment = asyncHandler(async (req, res, next) => {
    const { commentId } = req.params;

    if (!commentId) return next(new ApiError(400, "Comment id is required."));

    if (!isValidObjectId(commentId))
        return next(new ApiError(400, "Invalid comment id."));

    const commentObjectId = new mongoose.Types.ObjectId(commentId);

    const totalLikesOnComment = await Like.aggregate([
        {
            $match: {
                comment: commentObjectId,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "totalUsersToLike",
            },
        },
        {
            $addFields: {
                totalUser: {
                    $size: "$totalUsersToLike",
                },
            },
        },
        {
            $project: {
                comment: 1,
                totalUser: 1,
            },
        },
    ]);

    if (!totalLikesOnComment.length)
        return next(new ApiError(404, "Comment not found."));

    return res.status(200).json({
        success: true,
        message: "Total likes on comment fetched successfully.",
        totalLikesOnComment,
    });
});

// ---------------------------------------get total likes on a video-------------------------------
const getTotalLikeOnVideo = asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;

    if (!videoId)
        return next(new ApiError(400, "Video id is required to like."));

    if (!isValidObjectId(videoId))
        return next(new ApiError(400, "Invalid video id."));

    const videoObjectId = new mongoose.Types.ObjectId(videoId);

    const totalLikesOnVideo = await Like.aggregate([
        {
            $match: {
                video: videoObjectId,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "videoLikes",
            },
        },
        {
            $addFields: {
                totalVideoLikes: {
                    $size: "$videoLikes",
                },
            },
        },
        {
            $project: {
                video: 1,
                totalVideoLikes: 1,
            },
        },
    ]);

    if (!totalLikesOnVideo) return next(new ApiError(404, "Video not found."));

    return res.status(200).json({
        success: true,
        message: "Total likes on video fetched successfully.",
        totalLikesOnVideo,
    });
});

// ---------------------------------------get

export {
    togglevideoLike,
    toggleCommentLike,
    getTotalLikeOnComment,
    getTotalLikeOnVideo,
};
