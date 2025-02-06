import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

// const generateAccessAndRefereshTokens = async(userId) =>{
//     try {
//         const user = await User.findById(userId)
//         const accessToken = user.generateAccessToken()
//         const refreshToken = user.generateRefreshToken()

//         user.refreshToken = refreshToken
//         await user.save({ validateBeforeSave: false })

//         return {accessToken, refreshToken}

//     } catch (error) {
//         throw new ApiError(500, "Something went wrong while generating referesh and access token")
//     }
// }

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

    const { accessToken, refreshToken } = generateAccessAndRefereshTokens(
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

export { registerUser, loginUser };
