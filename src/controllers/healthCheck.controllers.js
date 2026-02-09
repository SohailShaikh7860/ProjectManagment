import { apiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async.js";

// const healthCheck = (req,res,next)=>{
//     try{
//        res
//         .status(200)
//         .json(new apiResponse(200, {message:"Its working fine"}));
//     }catch(err){
//         next(err);
//     }
// }

const healthCheck = asyncHandler(async (req,res)=>{
    res.status(200).json(
        new apiResponse(200, {message: "Server is running"})
    )
})

export {healthCheck};