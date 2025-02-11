import mongoose, { isValidObjectId } from "mongoose";
import Comment from "../models/comments.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ---------------------------------get comments controller--------------------------------
const getVideoComment = asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;
    let { limit, page } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    if (!videoId) return next(new ApiError(400, "Video is required."));
    if (!isValidObjectId(videoId))
        return next(new ApiError(400, "Invalid video id."));

    const videoObjectId = new mongoose.Types.ObjectId(videoId);
    // const videoObjectId =  static createFromTime();

    const aggregateQuery = [
        {
            $match: {
                video: videoObjectId,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userWhoCommented",
            },
        },
        {
            $unwind: "$userWhoCommented",
        },
        {
            $project: {
                content: 1,
                "userWhoCommented.userName": 1,
                "userWhoCommented.avatar": 1,
                createdAt: 1,
            },
        },
    ];

    const aggregate = Comment.aggregate(aggregateQuery);

    const options = { limit, page };

    const comments = await Comment.aggregatePaginate(aggregate, options);
    // console.log(comments);

    if (!comments || !comments.docs.length)
        return next(new ApiError(404, "Comments not found."));

    return res.status(200).json({
        success: true,
        message: "Comments fetched successfully.",
        comments,
    });
});

// --------------------------------add comments controller--------------------------------
const addComment = asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!content) return next(new ApiError(400, "Comment is required."));
    if (!videoId)
        return next(new ApiError(400, "Video is required to comment."));

    const comment = await Comment.create({
        content,
        owner: req?.user?.id,
        video: videoId,
    });

    if (!comment) return next(new ApiError("Unable to add comment."));

    return res.status(200).json({
        success: true,
        message: "Comment added successfully.",
        comment,
    });
});

// ---------------------------------delete comment controller-------------------------------
const deleteComment = asyncHandler(async (req, res, next) => {
    const { commentId } = req.params;

    if (!commentId) return next(new ApiError(400, "Comment not found."));

    if (!isValidObjectId(commentId))
        return next(new ApiError(400, "Invalid comment id."));

    const commentObjectId = new mongoose.Types.ObjectId(commentId);

    const deletedComment = await Comment.findByIdAndDelete(commentObjectId);

    if (!deletedComment) return next(new ApiError(404, "Comment not found."));

    return res
        .status(200)
        .json({ success: true, message: "Comment deleted successfully." });
});

// --------------------------------update comment controller------------------------------
const updateComment = asyncHandler(async (req, res, next) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId) return next(new ApiError(400, "Comment not found."));
    if (!content) return next(new ApiError(400, "Field is required."));

    if (!isValidObjectId(commentId))
        return next(new ApiError(400, "Invalid comment id."));

    const commentObjectId = new mongoose.Types.ObjectId(commentId);

    const updatedComment = await Comment.findByIdAndUpdate(
        commentObjectId,
        {
            $set: {
                content,
            },
        },
        {
            new: true,
        },
    );

    if (!updatedComment) return next(new ApiError(404, "Comment not found."));

    return res.status(200).json({
        success: true,
        message: "Comment updated successfully.",
        updatedComment,
    });
});

export { getVideoComment, addComment, deleteComment, updateComment };
