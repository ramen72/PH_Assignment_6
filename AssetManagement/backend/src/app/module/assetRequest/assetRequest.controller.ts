import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AssetRequestService } from "./assetRequest.service";

// Create Request Controller
const createAssetRequest = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User ID not found.");
	}
	const userId = req.user.userId;

	const result = await AssetRequestService.createAssetRequestService(
		userId,
		req.body,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Asset request created successfully",
		data: result,
	});
});

// Get All Requests Controller
const getAllAssetRequests = catchAsync(async (req: Request, res: Response) => {
	const result = await AssetRequestService.getAllAssetRequestsService(
		req.query,
		{
			page: req.query.page as string,
			limit: req.query.limit as string,
			sortBy: req.query.sortBy as string,
			sortOrder: req.query.sortOrder as string,
		},
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Asset requests retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

// Get My Requests Controller
const getMyAssetRequests = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"User Not Found or you are not login.",
		);
	}
	const userId = req.user.userId;

	const result = await AssetRequestService.getMyAssetRequestsService(
		userId,
		req.query,
		{
			page: req.query.page as string,
			limit: req.query.limit as string,
			sortBy: req.query.sortBy as string,
			sortOrder: req.query.sortOrder as string,
		},
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "My asset requests retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

// Get Single Request Controller
const getSingleAssetRequest = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;

		if (!req.user) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				"User Not Found or you are not login.",
			);
		}
		const userId = req.user.userId;

		const result = await AssetRequestService.getSingleAssetRequestService(
			id as string,
			userId,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Asset request retrieved successfully",
			data: result,
		});
	},
);

// Update Request Controller
const updateAssetRequest = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"User Not Found or you are not login.",
		);
	}

	const userId = req.user.userId;

	const result = await AssetRequestService.updateAssetRequestService(
		id as string,
		userId,
		req.body,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Asset request updated successfully",
		data: result,
	});
});

// Cancel Request Controller
const cancelAssetRequest = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"User Not Found or you are not login.",
		);
	}
	const userId = req.user.userId;

	const result = await AssetRequestService.cancelAssetRequestService(
		id as string,
		userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Asset request cancelled successfully",
		data: result,
	});
});

// Approve Request Controller
const approveAssetRequest = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"User Not Found or you are not login.",
		);
	}

	const reviewerId = req.user.userId;

	const result = await AssetRequestService.approveAssetRequestService(
		id as string,
		reviewerId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Asset request approved successfully",
		data: result,
	});
});

// Reject Request Controller
const rejectAssetRequest = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"User Not Found or you are not login.",
		);
	}

	const reviewerId = req.user.userId;

	const { rejectionReason } = req.body;

	const result = await AssetRequestService.rejectAssetRequestService(
		id as string,
		reviewerId,
		rejectionReason,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Asset request rejected successfully",
		data: result,
	});
});

// Delete Request Controller
const deleteAssetRequest = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	await AssetRequestService.deleteAssetRequestService(id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Asset request deleted successfully",
		data: null,
	});
});

export const AssetRequestController = {
	createAssetRequest,
	getAllAssetRequests,
	getMyAssetRequests,
	getSingleAssetRequest,
	updateAssetRequest,
	cancelAssetRequest,
	approveAssetRequest,
	rejectAssetRequest,
	deleteAssetRequest,
};
