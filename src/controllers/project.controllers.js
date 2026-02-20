import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { apiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async.js";
import mongoose from "mongoose";
import { ProjectMember } from "../models/projectmember.model.js";
import { UserRolesEnum } from "../utils/constatns.js";
import { pipeline } from "nodemailer/lib/xoauth2/index.js";

export const getProjects = asyncHandler(async (req, res) => {
  try{
  const projects = await ProjectMember.aggregate([
    {
      $match: {user: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $lookup:{
        from: "projects",
        localField: "projects",
        foreignField: "_id",
        as: "projects",
        pipeline:[
           {
              $lookup:{
                 from:"projectmembers",
                 localField:"_id",
                 foreignField:"projects",
                 as:"projectmembers",
              }
           },
           {
            $addFields:{
               members:{
                 $size:"$projectmembers"
               }
            }
           },
           {
             $unwind: "$projectmembers"
           },
           {
            $project:{
              _id:1,
              name:1,
              description: 1,
              members:1,
             createdBy:1,
             createdAt:1,
            },
            role:1,
            _id:0
           }
        ]
      }
    }
  ])

  return res.status(200).json(apiResponse(true, "Projects retrieved successfully", projects));
  }catch(error){
    return res.status(500).json(apiResponse(false, "Failed to retrieve projects", null));
  }
});

export const getProjectById = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  try {
    const project = await Project.findById(projectId).populate(
      "createdBy",
      "name email",
    );
    if (!project) {
      throw new ApiError(404, "Project not found");
    }
    res.json(apiResponse(true, "Project retrieved successfully", project));
  } catch (error) {
    res.json(apiResponse(false, "Failed to retrieve project", null));
  }
});

export const createProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, description } = req.body;

  try {
    const project = await Project.create({
      name,
      description,
      createdBy: new mongoose.Types.ObjectId(userId),
    });
    await ProjectMember.create({
      user: new mongoose.Types.ObjectId(userId),
      project: new mongoose.Types.ObjectId(project._id),
      role: UserRolesEnum.ADMIN,
    });
    res
      .status(201)
      .json(apiResponse(true, "Project created successfully", project));
  } catch (error) {
    res.json(apiResponse(false, "Failed to create project", null));
  }
});

export const updateProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user._id;
  const { name, description } = req.body;

  try {
    const project = await Project.findByIdAndUpdate(
      projectId,
      { name, description },
      { new: true },
    );
    if (!project) {
      throw new ApiError(404, "Project not found");
    }
   return res.json(apiResponse(true, "Project updated successfully", project));
  } catch (error) {
   return res.json(apiResponse(false, "Failed to update project", null));
  }
});


export const deleteProject = asyncHandler(async (req,res)=>{
    const projectId = req.params.id;
    try {
        const project = await Project.findByIdAndDelete(projectId);
        if(!project){
            throw new ApiError(404, "Project not found");
        }
       return res.json(apiResponse(true, "Project deleted successfully", null));
    } catch (error) {
       return res.json(apiResponse(false, "Failed to delete project", null));
    }
})

export const addMemberToProject = asyncHandler(async(req,res)=>{
    const projectId = req.params.id;
    const { email, role } = req.body;

    try {
      const user = await User.findOne({ email });

      if(!user){
        throw new ApiError(404, "User not found");
      }

      await ProjectMember.findByIdAndUpdate(
        
        {
           user: new mongoose.Types.ObjectId(user._id),
           project: new mongoose.Types.ObjectId(projectId),
        },
        {
           user: new mongoose.Types.ObjectId(user._id),
           project: new mongoose.Types.ObjectId(projectId),
           role: role,
        },
        {
          new: true,
          upsert: true,
        }
      )

      return res.json(apiResponse(true, "Member added to project successfully", null));
    } catch (error) {
      return res.json(apiResponse(false, "Failed to add member to project", null));
    }
})

export const getProjectMembers = asyncHandler(async(req,res)=>{
    const projectId = req.params.id;

    try {
       const members = await ProjectMember.find({ project: projectId }).populate("user", "name email");

       if(!members){
        throw new ApiError(404, "Project members not found");
       }

       const projectMembers = await ProjectMember.aggregate({
          $match: {
             project: new mongoose.Types.ObjectId(projectId)
          }
       },
        
       {
          $lookup:{
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "user",
              pipeline:[
                 {
                  $project:{
                     _id: 1,
                     username: 1,
                    fullName:1,
                    avatar:1
                  }
                 }
              ]
          }
       },

       {
          $addFields:{
              user:{
                 $arrayElemAt: ["$user",0]
              }
          }
       },

       {
         $project:{
            project:1,
            user:1,
            role:1,
            createdAt:1,
            updatedAt:1,
            _id:0
         }
       }
      )
      return res.json(apiResponse(true, "Project members retrieved successfully", projectMembers));
    } catch (error) {
      return res.json(apiResponse(false, "Failed to retrieve project members", null));
    }
})

export const updateMemberRole = asyncHandler(async(req,res)=>{
    const projectId = req.params.id;
    const { userId, role } = req.body;

    try {
      const updatedMember = await ProjectMember.findOneAndUpdate(
        { project: projectId, user: userId },
        { role: role },
        { new: true }
      );

      if (!updatedMember) {
        throw new ApiError(404, "Project member not found");
      }

      return res.json(apiResponse(true, "Member role updated successfully", updatedMember));
    } catch (error) {
      return res.json(apiResponse(false, "Failed to update member role", null));
    }
})

export const deleteMemberFromProject = asyncHandler(async(req,res)=>{
    const projectId = req.params.id;
    const { userId } = req.body;

    try {
      const deletedMember = await ProjectMember.findOneAndDelete({
        project: projectId,
        user: userId
      });

      if (!deletedMember) {
        throw new ApiError(404, "Project member not found");
      }

      return res.json(apiResponse(true, "Member deleted from project successfully", null));
    } catch (error) {
      return res.json(apiResponse(false, "Failed to delete member from project", null));
    }
})