import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { apiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async.js";


const getProjects = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    try {
         const projects = await Project.find({createdBy: userId});
    res.json(apiResponse(true, "Projects retrieved successfully", projects));
    } catch (error) {
        res.json(apiResponse(false, "Failed to retrieve projects", null));
    }
})