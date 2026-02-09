import { Router } from "express";
import { login, registerUser,logoutUser, verifyEmail, refreshAccessToken, forgotPasswordRequest, resetForgotPassword, getCurrentUser, changePassword, resendEmail} from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userRegisterValidator, userLoginValidator, userForgotPassword, userChangeCurrentPassword } from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//unsecure
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, login);
router.route("/verify-email/:verificationToken").get(verifyEmail);

router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(userForgotPassword(), validate,forgotPasswordRequest);
router.route("/reset-password/:resetToken").post(userForgotPassword(), validate, resetForgotPassword);

//secure route
router.route("/logoutUser").post(verifyJWT, logoutUser);
router.route("/curreent-user").post(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, userChangeCurrentPassword(), validate, changePassword);
router.route("/resend-email-verification").post(verifyJWT, resendEmail);

export default router;
