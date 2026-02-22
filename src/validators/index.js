import { body } from "express-validator";
import { availableRoleEnum } from "../utils/constatns.js";

const userRegisterValidator = () =>{
     return [
        body("email")
             .trim()
             .notEmpty()
             .withMessage("Email is required")
             .isEmail()
             .withMessage("Email is invalid"),

        body("username")
          .trim()
          .notEmpty()
          .withMessage("username is required")
          .isLowercase()
          .withMessage("username must be in lower case")
          .isLength({min:3})
          .withMessage("username must be at least 3 characters long"),

          body("password")
             .trim()
             .notEmpty()
             .withMessage("Password is required"),

          body("fullname")
          .optional()
          .trim(),
     ]
}

const userLoginValidator = ()=>{
    return[
        body("email")
        .optional()
        .isEmail()
        .withMessage("Email is invalid"),
        
        body("password")
        .notEmpty()
        .withMessage("Password is required")
    ]
}

const userChangeCurrentPassword = ()=>{
    return[
        body("oldPassword")
        .notEmpty()
        .withMessage("old Password is required"),

        body("newPassword")
        .notEmpty()
        .withMessage("new Password is required"),
    ]
}

const userForgotPassword = ()=>{
    return [
        body("email")
         .notEmpty()
         .withMessage("Email is required")
         .isEmail()
         .withMessage("Email is invalid")
    ]
};

const userResetForgotPassword = ()=>{
    return [
        body("newPassword")
         .notEmpty()
         .withMessage("password is required")
    ]
}

const createProjectValidator = ()=>{
     return [
        body("name")
          .notEmpty()
          .withMessage("Project name is required"),
        body("description")
            .optional()
     ]
}

const addMemberToProjectValidator = ()=>{
    return [
        body("email")
         .notEmpty()
         .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("role")
         .notEmpty()
         .withMessage("Role is required")
         .isIn(availableRoleEnum)
         .withMessage(`Role must be one of the following: ${availableRoleEnum.join(", ")}`)
    ]
}

export {
    userRegisterValidator,
    userLoginValidator,
    userChangeCurrentPassword,
    userForgotPassword,
    userResetForgotPassword,
    createProjectValidator,
    addMemberToProjectValidator
}