import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AuthService } from "./auth.service";

const userRegister = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	console.log(payload);
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

	const { accessToken, refreshToken, user, profile } = result;

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Patient email verification has been done successfully",
		data: {
			accessToken,
			refreshToken,
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

/*
const loginUser = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const result = await AuthService.loginUser(payload);
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
});

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

const refreshToken = catchAsync(async (req: Request, res: Response) => {
	if (!req.cookies.refreshToken) {
		throw new AppError(httpStatus.BAD_REQUEST,"Refresh token is missing");
	}
	const result = await AuthService.refreshToken(req.cookies.refreshToken);
	const { accessToken, refreshToken: newRefreshToken } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", newRefreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
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
*/
export const AuthController = {
	userRegister,
	verifyUserEmail,
	googleLoginController,
	/*
	loginUser,
	getMe,
	refreshToken,
	forgotPasswordController,
	resetPasswordController,
	*/
};
