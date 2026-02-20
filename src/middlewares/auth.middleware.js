import mongoose from "mongoose";
import { ProjectMember } from "../models/projectmember.model.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async(req,res,next)=>{

   const token =  req.cookies?.accessToken || req.header("Authorization")?.
    replace("Bearer", "")

    if(!token){
        throw new ApiError(401, "Unauthorized request");
    }

    try{
      const decodeToken =  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
     const user =  await User.findById(decodeToken?._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    if(!user){
        throw new ApiError(401, "Invalid access token");
    }
    req.user = user;
    next();
    }catch(error){
     console.error("JWT verification failed:", error.message); // debug log

  if (error.name === "TokenExpiredError") {
    throw new ApiError(401, "Access token expired");
  }

  if (error.name === "JsonWebTokenError") {
    throw new ApiError(401, "Invalid access token");
  }

  throw new ApiError(401, "Authentication failed");
    }
})

export const validateRole = (roles = []) =>{
    asyncHandler(async (req,res, next)=>{
        const {projectId} = req.params;

        if(!projectId){
            throw new ApiError(400, "Project ID is required");
        }

       const project =  await ProjectMember.findOne({
           project: new mongoose.Types.ObjectId(projectId),
           user: new mongoose.Types.ObjectId(req.user._id),
           role: { $in: roles },
        })
        if(!project){
            throw new ApiError(403, "User does not have required role");
        }

        const givenRole = project?.role

        req.user.role = givenRole;

        if(!roles.includes(givenRole)){
            throw new ApiError(403, "User does not have required role");
        }

        next();
    })
}