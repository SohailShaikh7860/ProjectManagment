
import { User } from "../models/user.models.js";
import { apiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async.js";
import { emailVerificationMail, forgotPasswordMail, sendEmail } from "../utils/mail.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId)=>{
    try{
       const user = await User.findById(userId)
      const accessToken = user.generateAccessToken();
       const refreshToken = user.generateRefreshToken();

       user.refreshToken = refreshToken
       await user.save({validateBeforeSave:false})
       return {accessToken,refreshToken}
    }catch(err){
       throw new ApiError(
        500,
        "Somthing went wrong by accessing token"
       )
    }
}

const registerUser = asyncHandler(async (req,res)=>{
    const {email, username, password, role} = req.body;

  const existedUser =  await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists", []);
    }

    const user = await User.create({
        email,
        username,
        password,
        isEmailVerified: false
    })

   const {unHashTokens, hashedToken, tokenExpiray} = user.generateTemporaryToken();

     user.emailVerificationToken = hashedToken;
     user.emailVerificationExpiry = tokenExpiray;

     await user.save({validateBeforeSave:false})

    const verfyToken = await sendEmail(
        {
            email: user?.email,
            subject: "Please verify your email",
            mailgenContent:emailVerificationMail(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/
                verify-email/${unHashTokens}
                `
            ),
        }
     )

     console.log(verfyToken);
     

    const createdUser =  await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
     );

     if(!createdUser){
        throw new ApiError(500, "Somthing went wrong while registering a user")
     }

     return res
     .status(201)
     .json(
        new apiResponse(
            200,
            {user: createdUser},
            "user Register successfully and verfication email has been sent on your email"
        )
     )
})

const login = asyncHandler(async (req,res)=>{
     const {email, password, username} = req.body;

     if(!username || !email){
        throw new ApiError(400, "Username or email is required")
     }

    const user =  await User.findOne({email});

    if(!user){
        throw new ApiError(400, "User does not exists");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
       throw new ApiError(400, "Invalid credentials"); 
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);

     const loggedInUser =  await User.findById(user._id).select(
        "-password-refreshToken -emailVerificationToken -emailVerificationExpiry"
     );

     const options = {
        httpOnly:true,
        secure:true,
     }

     return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new apiResponse(
                200,
                {
                    user:loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User, logged in successfully"
            )
        )
})


const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
           $set:{
            refreshToken:""
           } 
        },
        {
            new: true
        },
    );
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new apiResponse(200, {}, "User logged out")
    );
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        )
    )
})

const verifyEmail = asyncHandler(async (req,res)=>{
   const {verificationToken} =  req.params

   if(!verificationToken){
    throw new ApiError(400, "Email verification token is missing")
   }

   let hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex")

      const user =  await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpiry : {$gt: Date.now()}
        })

        if(!user){
            throw new ApiError(400,"Token is invalid or expired");
        }
 
        user.emailVerificationExpiry = undefined;
        user.emailVerificationToken = undefined;
        
        user.isEmailVerified = true;
        await user.save({validateBeforeSave: false});

        return res 
           .status(200)
           .json(
            new apiResponse(
                200,
                {
                    isEmailVerified:true
                },
                "Email is verified"
            )
           )
})
const resendEmail = asyncHandler(async (req,res)=>{
   const user = await User.findById(req.user?._id);

   if(!user){
    throw new ApiError(404, "User does not exist");
   }

   if(user.isEmailVerified){
      throw new ApiError(409, "Email is already verified");
   }
  
    const {unHashTokens, hashedToken, tokenExpiray} = user.generateTemporaryToken();

     user.emailVerificationToken = hashedToken;
     user.emailVerificationExpiry = tokenExpiray;

     await user.save({validateBeforeSave:false})

     await sendEmail(
        {
            email: user?.email,
            subject: "Please verify your email",
            mailgenContent:emailVerificationMail(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/
                verify-email/${unHashTokens}
                `
            ),
        }
     );

     return res
       .status(200)
       .json(
        new apiResponse(
            200,
            {},
            "Mail has sent to your email id"
        )
       )

})

const refreshAccessToken = asyncHandler(async (req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
 
  if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorized access")
  }

  try{
     const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
     
    const user =  await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401, "Invalid refresh token");
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401, "Refresh token is expired");
    }

    const options = {
        httpOnly: true,
        secure: true
    }

   const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

     user.refreshToken = newRefreshToken;

     await user.save();
     return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access token refreshed"
        )
      )

  } catch(error){
    throw new ApiError(401, "Invalid refresh token");
  }

});

const forgotPasswordRequest = asyncHandler(async (req,res)=>{
     const {email} = req.body;

     const user = await User.findOne({email});

     if(!user){
        throw new ApiError(404, "User does not exists", []);
     }

     const {unHashTokens, hashedToken, tokenExpiray} = user.generateTemporaryToken();

     user.forgotPasswordToken = hashedToken
     user.forgotPasswordExpiry = tokenExpiray

     await user.save({validateBeforeSave:false});

     await sendEmail({
         email: user?.email,
            subject: "Please verify your email",
            mailgenContent:forgotPasswordMail(
                user.username,
                `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashTokens},
                `
            )
     })

     return res
       .status(200)
       .json(
        new apiResponse(
            200,
            {},
            "Password reset mail has been sent on your mail id"
        )
       )
})

const resetForgotPassword = asyncHandler(async (req,res)=>{
    const {reseetToken} = req.params;
    const {newPassword} = req.body

    let hashedToken = crypto
      .createHash("sha256")
      .update(reseetToken)
      .digest("hex")

     const user = await User.findOne({
        forgotPasswordExpiry: {$gt:Date.now()},
        forgotPasswordToken: hashedToken
      })

      if(!user){
       throw new ApiError(489, "Token is invalid or expired")
      }

      user.forgotPasswordExpiry = undefined
      user.forgotPasswordToken = undefined

      user.password = newPassword
      await user.save({validateBeforeSave:false})

      return res
        .status(200)
        .json(
            new apiResponse(
                200,
                {},
                "Password reset successfully"
            )
        )
})

const changePassword = asyncHandler(async (req,res)=>{
    const {oldPassword, newPassword} = req.body;

    const user = User.findById(req.user?._id);

   const isPasswordValid =  await user.isPasswordCorrect(oldPassword)

   if(!isPasswordValid){
    throw new ApiError(400, "Invalid old password")
   }

   user.password = newPassword
   await user.save({validateBeforeSave:false});

   return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {},
            "Password changed successfully"
        )
    )
})

export{
    registerUser,
    generateAccessAndRefreshTokens,
    login,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendEmail,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    changePassword
}