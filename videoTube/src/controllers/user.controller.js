import mongoose from "mongoose";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

//-----------------------------------------------access and refresh token---------------------------------
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        next(new ApiError(500, "error generating accessToken"));
    }
};

// --------------------------------------------register user controller-----------------------------------
const registerUser = asyncHandler(async (req, res, next) => {
    const { userName, email, fullName, password } = req.body;

    if ([userName, email, fullName, password].some((i) => i?.trim() === "")) {
        return next(new ApiError(400, "All fields are required."));
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return next(new ApiError(409, "user already registered."));
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath)
        return next(new ApiError(400, "Avatar file local path  is required."));

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) return next(new ApiError(400, "Avatar file is required."));

    const user = await User.create({
        fullName,
        email,
        password,
        userName,
        avatar: avatar?.url || "",
        coverImage: coverImage?.url || "",
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken",
    );

    if (!createdUser) return next(500, "Failed to register user.");

    return res.status(200).json({
        success: true,
        message: "user registered successfully.",
        createdUser,
    });
});

// --------------------------------------------login user controller---------------------------------------
const loginUser = asyncHandler(async (req, res, next) => {
    const { identifier, password } = req.body; // identifier can be email or username

    // console.log(req.body);

    if ([identifier, password].some((i) => i?.trim === ""))
        return next(new ApiError(400, "All field are required."));

    const isEmail = identifier.includes("@");

    let user = await User.findOne(
        isEmail ? { email: identifier } : { userName: identifier },
    );

    if (!user)
        return next(new ApiError(404, "user not found, please register."));

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect)
        return next(new ApiError(400, "Invalid credentials."));

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
        user._id,
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -accessToken -refreshToken",
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json({
            success: true,
            message: "login successfull.",
            loggedInUser,
        });
});

// ----------------------------------------------logout user controller----------------------------------------
const logoutUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        },
    );

    const options = {
        secure: true,
        httpOnly: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json({ success: true, message: "user logout successfull." });
});

// --------------------------------------------refresh access token controller------------------------------
const refreshAccessToken = asyncHandler(async (req, res, next) => {
    const incomingRefreshToken = req.cookies.refreshToken;

    if (!incomingRefreshToken)
        return next(new ApiError(401, "Unauthorized access."));

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) return next(new ApiError(401, "Invalid refresh token."));

        if (incomingRefreshToken !== user?.refreshToken)
            return next(new ApiError(401, "Refresh token expired."));

        const { accessToken, refreshToken } =
            await generateAccessAndRefereshTokens(user._id);

        const options = {
            secure: true,
            httpOnly: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({ success: true, message: "access token refreshed." });
    } catch (error) {
        next(new ApiError(500, "error refreshing tokens", error));
    }
});

// --------------------------------------------change password---------------------------------------------
const changePassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    if ([oldPassword, newPassword].some((i) => i?.trim() === ""))
        return next(new ApiError(400, "All fields are required."));

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) return next(new ApiError(401, "Invalid password"));

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json({ success: true, message: "Password changed successfully." });
});

// --------------------------------------------get current user------------------------------------------
const getCurrentUser = asyncHandler(async (req, res, next) => {
    const user = req.user;
    return res
        .status(200)
        .json({ success: true, message: "user fetched successfull.", user });
});

// --------------------------------------------updateFullNameAndEmail controller---------------------
const updateFullNameAndEmail = asyncHandler(async (req, res, next) => {
    const { fullName, email } = req.body;

    // if([fullName, email].some((i) => i.trim() === "")) return next(new ApiError(400, 'all'))

    const updateFields = {};
    if (fullName) updateFields.fullName = fullName;
    if (email) updateFields.email = email;

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: updateFields,
        },
        {
            new: true,
        },
    ).select("-password -refreshToken -accessToken");

    return res
        .status(200)
        .json({ success: true, message: "fullName and email updated.", user });
});

// --------------------------------------------update avatar controller---------------------------------------------------
const updateAvatar = asyncHandler(async (req, res, next) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) return next(new ApiError(400, "Avatar is required."));

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) return next(new ApiError(400, "Avatar is required."));

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar?.url,
            },
        },
        {
            new: true,
        },
    ).select("-password -refreshToken -accessToken");

    return res
        .status(200)
        .json({ success: true, message: "avatar updated successfully.", user });
});

// ----------------------------------------update coverImage controller------------------------------------------
const updateCoverImage = asyncHandler(async (req, res, next) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath)
        return next(new ApiError(400, "cover image is required."));

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage) return next(new ApiError(400, "cover image is required."));

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            },
        },
        {
            new: true,
        },
    ).select("-password -refreshToken -accessToken");

    return res.status(200).json({
        success: true,
        message: "cover image updated successfully.",
        user,
    });
});

// ---------------------------------------get channel controller-----------------------------------(tbt)
const getChannel = asyncHandler(async (req, res, next) => {
    const { userName } = req.params;

    if (!userName) return next(new ApiError(404, "Channel not found."));

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName,
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                to: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                to: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                subscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscriber: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                email: 1,
                isSubscriber: 1,
                subscribedToCount: 1,
                subscribersCount: 1,
                avatar: 1,
                coverImage: 1,
            },
        },
    ]);

    //clg channel

    if (!channel.length) return next(new ApiError(404, "channel not found."));

    return res.status(200).json({
        success: true,
        message: "channel fetched successfully.",
        channel: channel[0],
    });
});

// --------------------------------------get watch histroy controller-------------------------------(tbt)
const getWatchHistory = asyncHandler(async (req, res, next) => {
    const userHistory = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "_id",
                            foreignField: "owner",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        userName: 1,
                                        fullName: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);

    if (!userHistory.length)
        return next(new ApiError(404, "history not found"));

    return res.status(200).json({
        success: true,
        message: "History fetched successfully.",
        userHistory: userHistory[0],
    });
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateFullNameAndEmail,
    updateAvatar,
    updateCoverImage,
    getChannel,
    getWatchHistory,
};
