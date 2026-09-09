import { Router } from "express";

import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import {
	ForgotPasswordZodSchema,
	LoginZodSchema,
	ResetPasswordZodSchema,
	UserEmailVerifyZodSchema,
	UserRegisterZodSchema,
} from "./zodSchema";

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

router.post(
	"/login",
	validateRequest(LoginZodSchema),
	AuthController.userLogin,
);

router.post(
	"/logout",
	auth(
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
		UserRole.MANAGER,
		UserRole.EMPLOYEE,
	),
	AuthController.userLogout,
);

router.post(
	"/logoutAllDevices",
	auth(
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
		UserRole.MANAGER,
		UserRole.EMPLOYEE,
	),
	AuthController.userLogoutFromAllDevices,
);

router.post("/refreshToken", AuthController.refreshToken);

/*
router.get(
	"/me",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE),
	// validateRequest (if needed)
	AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);




*/
export const AuthRoutes = router;
