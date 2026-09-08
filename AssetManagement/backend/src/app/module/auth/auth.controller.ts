import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AuthService } from "./auth.service";
import config from "../../config";
import { AppError } from "../../utils/AppError";

const userRegister = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	
	await AuthService.userRegisterService(payload);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message:
			"Temporary Patient registered successfully. Please verify your account within 5 minutes otherwise account registration will cancel automatically.",
		data: {},
	});
});

const verifyUserEmail = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const result = await AuthService.verifyUserEmailService(payload);

	// const { accessToken, refreshToken, user, profile } = result;
	const { user, profile } = result;

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Patient email verification has been done successfully",
		data: {
			// accessToken,
			// refreshToken,
			user,
			profile,
		},
	});
});

const googleLoginController = catchAsync(
	async (req: Request, res: Response) => {
		const payload = req.body;
		const result = await AuthService.googleLoginService(payload);

		const { accessToken, refreshToken } = result;

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: false,
			sameSite: "none",
			maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
		});
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: false,
			sameSite: "none",
			maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
		});

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "User logged in successfully",
			data: {
				accessToken,
				refreshToken,
			},
		});
	},
);

const forgotPasswordController = catchAsync(
	async (req: Request, res: Response) => {
		const payload = req.body;

		await AuthService.forgotPasswordService(payload);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: `OTP has been sent to your email (${payload.email}) successfully.`,
			data: {},
		});
	},
);

const resetPasswordController = catchAsync(
	async (req: Request, res: Response) => {
		const payload = req.body;

		await AuthService.resetPasswordService(payload);
		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "User Password has been changed successfully.",
			data: {},
		});
	},
);

const userLogin = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await AuthService.userLoginService(payload);

	const { accessToken, refreshToken } = result;
	// Access Token Cookie
	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: config.node_env === "production",
		sameSite: config.node_env === "production" ? "none" : "lax",
		maxAge: 1000 * 60 * 60, // 1 hour
	});

	// Refresh Token Cookie
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: config.node_env === "production",
		sameSite: config.node_env === "production" ? "none" : "lax",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User logged in successfully",
		data: null,
	});
});

const userLogout = catchAsync(async (req: Request, res: Response) => {
	const refreshToken = req.cookies.refreshToken;

	await AuthService.userLogoutService(refreshToken);

	res.clearCookie("accessToken");
	res.clearCookie("refreshToken");

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User logged out successfully",
		data: {},
	});
});

const userLogoutFromAllDevices = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"User information is missing in the request",
			);
		}
		const userId = req.user.userId;

		await AuthService.userLogoutFromAllDevicesService(userId);

		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Logged out from all devices successfully",
			data: {},
		});
	},
);

const refreshToken = catchAsync(async (req: Request, res: Response) => {
	const { refreshToken } = req.cookies;

	if (!refreshToken) {
		throw new AppError(httpStatus.BAD_REQUEST, "Refresh token is required");
	}
	const result = await AuthService.refreshTokenService(refreshToken);
	const { accessToken, refreshToken: newRefreshToken } = result;

	// Access Token Cookie
	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: config.node_env === "production",
		sameSite: config.node_env === "production" ? "none" : "lax",
		maxAge: 1000 * 60 * 60, // 1 hour
	});

	// Refresh Token Cookie
	res.cookie("refreshToken", newRefreshToken, {
		httpOnly: true,
		secure: config.node_env === "production",
		sameSite: config.node_env === "production" ? "none" : "lax",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: {
			accessToken,
			refreshToken: newRefreshToken,
		},
	});
});

/*

const getMe = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as unknown as IRequestUser;

	if (!user) {
		throw new AppError(httpStatus.BAD_REQUEST,"User information is missing in the request");
	}

	const result = await AuthService.getMe(user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile fetched successfully",
		data: result,
	});
});




*/
export const AuthController = {
	userRegister,
	verifyUserEmail,
	googleLoginController,
	forgotPasswordController,
	resetPasswordController,
	userLogin,
	userLogout,
	userLogoutFromAllDevices,
	refreshToken,
	/*
	getMe,
	*/
};
