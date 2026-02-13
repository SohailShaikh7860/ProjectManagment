import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { apiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async.js";
import mongoose from "mongoose";
import { ProjectMember } from "../models/projectmember.model.js";
import { UserRolesEnum } from "../utils/constatns.js";

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