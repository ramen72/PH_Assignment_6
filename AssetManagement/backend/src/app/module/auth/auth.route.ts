import { Router } from "express";
// import { UserRole } from "../../../generated/prisma/enums";
// import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { UserEmailVerifyZodSchema, UserRegisterZodSchema } from "./zodSchema";

const router = Router();

router.post(
	"/register",
	validateRequest(UserRegisterZodSchema),
	AuthController.userRegister,
);

router.post(
	"/verifyEmail",
	validateRequest(UserEmailVerifyZodSchema),
	AuthController.verifyUserEmail,
);
router.post("/google", AuthController.googleLoginController);
/*
router.post(
	"/login",
	validateRequest(LoginZodSchema),
	AuthController.loginUser,
);
router.get(
	"/me",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE),
	// validateRequest (if needed)
	AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);

router.post(
	"/forgotPassword",
	validateRequest(ForgotPasswordZodSchema),
	AuthController.forgotPasswordController,
);
router.post(
	"/resetPassword",
	validateRequest(ResetPasswordZodSchema),
	AuthController.resetPasswordController,
);

*/
export const AuthRoutes = router;
