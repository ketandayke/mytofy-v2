import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if ([username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select("-password")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // Generate token so they login immediately
    const accessToken = createdUser.generateAccessToken();

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res.status(201)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(201, { user: createdUser, accessToken }, "User registered successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!email && !username) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const accessToken = user.generateAccessToken()

    const loggedInUser = await User.findById(user._id).select("-password")

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
        new ApiResponse(
            200, 
            { user: loggedInUser, accessToken },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) => {
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})

const updateProfile = asyncHandler(async (req, res) => {
    const { username, email, avatar } = req.body;
    
    // Check if new email/username is already taken by someone else
    if (username || email) {
        const query = [];
        if (username) query.push({ username: username.toLowerCase() });
        if (email) query.push({ email });
        
        const existing = await User.findOne({
            _id: { $ne: req.user._id },
            $or: query
        });
        
        if (existing) {
            throw new ApiError(409, "Username or email already taken");
        }
    }

    const updates = {};
    if (username) updates.username = username.toLowerCase();
    if (email) updates.email = email;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Profile updated successfully"));
});

const deleteProfile = asyncHandler(async (req, res) => {
    await User.findByIdAndDelete(req.user._id);

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    updateProfile,
    deleteProfile
}
