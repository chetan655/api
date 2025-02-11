import { asyncHandler } from "../utils/asyncHandler.js";
import Video from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// -----------------------------------------------------get all videos controller---------------------------------
const getAllVideos = asyncHandler(async (req, res, next) => {
    let {
        userId = "",
        sortBy = "createdAt",
        sortType = "desc",
        page = 1,
        limit = 10,
        query = "",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};

    if (userId) {
        filter.userId = new mongoose.Types.ObjectId(userId);
    }

    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
        ];
    }

    const aggregateQuery = [
        { $match: { ...filter } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        {
            $project: {
                _id: 1,
                title: 1,
                "user.userName": 1,
                "user.avatar": 1,
                coverImage: 1,
            },
        },
        { $sort: { [sortBy]: sortType === "desc" ? -1 : 1 } },
    ];

    const aggregate = Video.aggregate(aggregateQuery);

    const options = { limit, page };

    const videos = await Video.aggregatePaginate(aggregate, options);

    if (!videos.docs.length) return next(new ApiError(404, "No video found."));

    return res.status(200).json({
        success: true,
        message: "Videos fetched successfully.",
        videos,
    });
});

// ----------------------------------------------------get particular video controller---------------------------
const getParticularVideo = asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;

    if (!videoId) return next(new ApiError(400, "video id is required."));

    const video = await Video.findById(videoId);

    if (!video) return next(new ApiError(404, "video not found."));

    return res.status(200).json({
        success: true,
        message: "video fetched successfully.",
        video,
    });
});

// -----------------------------------------------------upload video controller---------------------------------
const uploadVideo = asyncHandler(async (req, res, next) => {
    const { title, description } = req.body;

    if (!title) return next(new ApiError(400, "Title is required."));

    const videoLocalPath = req.files?.video?.[0].path;

    let thumbnailLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.thumbnail) &&
        req.files.thumbnail.length > 0
    ) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }

    if (!videoLocalPath)
        return next(new ApiError(400, "Video file local path is required."));

    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!video) return next(new ApiError(400, "Video file is required."));

    let thumbnailURL;

    thumbnailURL = thumbnail?.url || "";

    const newVideo = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnailURL,
        owner: req?.user?._id,
        title: title,
        description: description || "",
        duration: video.duration,
    });

    if (!newVideo) return next(new ApiError(500, "Failed to upload video."));

    return res.status(200).json({
        success: true,
        message: "Video uploaded successfully.",
        newVideo,
    });
});

// -------------------------------------------------delete video controller-----------------------------------
const deleteVideo = asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;

    if (!videoId) return next(new ApiError(400, "VideoId is required."));

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) return next(new ApiError(404, "Video not found."));

    // delete from cloudinary

    return res.status(200).json({
        success: true,
        message: "Video deleted successfully.",
    });
});

// -------------------------------------------------update video title, thumbnail and description controller------------------------
const updateVideoDetails = asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    const fields = {};
    if (title) fields.title = title;
    if (description) fields.description = description;

    const thumbnailLocalPath = req?.file?.path;

    let thumbnail;
    thumbnail = thumbnailLocalPath
        ? await uploadOnCloudinary(thumbnailLocalPath)
        : "";

    if (thumbnail) fields.thumbnail = thumbnail?.url;

    // delete old thumbnail from cloudinary

    if (!Object.keys(fields).length)
        return next(new ApiError(400, "At least one filed is required."));

    const updatedFields = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: fields,
        },
        {
            new: true,
        },
    ).select("-videoFile -duration");

    if (!updatedFields)
        return next(new ApiError(500, "Failed to update fields."));

    return res.status(200).json({
        success: true,
        message: "Fields updated successfully.",
        updatedFields,
    });
});

export {
    getAllVideos,
    getParticularVideo,
    uploadVideo,
    deleteVideo,
    updateVideoDetails,
};
