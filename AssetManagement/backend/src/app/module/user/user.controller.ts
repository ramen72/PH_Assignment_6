import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserServices } from "./user.service";

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
	// console.log("ReqFile", req.file)

	if (!req.file) {
		throw new Error("No file Provided.");
	}
	const userId = req?.user?.userId;
	if (!userId) {
		throw new Error("You are not Login.");
	}

	const result = await UserServices.uploadProfileImageService(
		req?.file?.buffer,
		userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "File uploaded successfully.",
		data: result,
	});
});

export const UserController = {
	uploadProfileImage,
};
