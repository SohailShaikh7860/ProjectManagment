import mongoose, {Schema} from "mongoose";
import { AvailableTaskStatues, TaskStatusEnum } from "../utils/constatns";

const taskSchema = new Schema({
    title:{
        type:String,
        required: true,
        trim: true
    },
    description:{
        type:String
    },
    project:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    assignedTo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    assignedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    status:{
        type: String,
        enum: AvailableTaskStatues,
        default: TaskStatusEnum.TODO
    },
    attachments:{
        type: [{
            url: String,
            mimeType: String,
            size: Number
        }],
        default: []
    }
},{timestamps: true});

export const Task = mongoose.model("Task", taskSchema);