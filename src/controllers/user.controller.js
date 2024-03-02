import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import uploadAssetsOnCloudinary from '../utils/cloudinary.js'
import ApiResponse from '../utils/ApiResponse.js'


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken }
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Error generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // get user data from the frontend
    const { fullname, username, email, password } = req.body

    // do validation checks - not empty
    if ([fullname, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists: username, email
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existingUser)
        throw new ApiError(409, "User with email or username already exists")


    // check for assets
    console.log("Files in request", req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath)
        throw new ApiError(400, "Avatar file is required")


    // upload files to cloudinary
    const avatar = await uploadAssetsOnCloudinary(avatarLocalPath)
    const coverImage = await uploadAssetsOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Error uploading avatar file to cloudinary")
    }

    // create user object - create entry in db
    const user = await User.create({
        fullName: fullname,
        userName: username.toLowerCase(),
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
        email: email.toLowerCase(),
        password
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    // check for user creation
    if (!createdUser)
        throw new ApiError(500, "Error creating user in the database")

    // return the response to user
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // take the email and password from user
    const { email, password } = req.body
    if (!email || !password)
        throw new ApiError(400, "Email and password are required")
    // check if user exists
    const user = await User.findOne({ email })
    if (!user)
        throw new ApiError(404, "User with email does not exist")
    // if user exists then check if password is correct
    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect)
        throw new ApiError(401, "Password is incorrect")
    // if password is correct then generate tokens and send it to user else send error
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: user, accessToken, refreshToken
            }
                , "User logged in successfully")
        )
})


const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            },
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser
}