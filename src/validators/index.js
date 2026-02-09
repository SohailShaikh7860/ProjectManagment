import { body } from "express-validator";

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

export {
    userRegisterValidator,
    userLoginValidator,
    userChangeCurrentPassword,
    userForgotPassword,
    userResetForgotPassword
}