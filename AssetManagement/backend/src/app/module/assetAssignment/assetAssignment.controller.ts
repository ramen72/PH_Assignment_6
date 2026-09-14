import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AssetAssignmentService } from "./assetAssignment.service";

// CREATE ASSIGNMENT
const createAssetAssignment = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new AppError(httpStatus.BAD_REQUEST, "Requested user not found.");
		}
		const assignedById = req.user.userId;

		const result = await AssetAssignmentService.createAssetAssignmentService(
			req.body,
			assignedById,
		);

		sendResponse(res, {
			statusCode: httpStatus.CREATED,
			success: true,
			message: "Asset assigned successfully",
			data: result,
		});
	},
);

// GET ALL ASSIGNMENTS
const getAllAssetAssignments = catchAsync(
	async (req: Request, res: Response) => {
		const result = await AssetAssignmentService.getAllAssetAssignmentsService(
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
			message: "Asset assignments retrieved successfully",
			meta: result.meta,
			data: result.data,
		});
	},
);

// GET SINGLE ASSIGNMENT
const getSingleAssetAssignment = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;

		if (!id) {
			throw new AppError(httpStatus.NOT_FOUND, "Asset Assignment ID not Found");
		}

		const result = await AssetAssignmentService.getSingleAssetAssignmentService(
			id as string,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Asset assignment retrieved successfully",
			data: result,
		});
	},
);

// RETURN ASSET
const returnAssetAssignment = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;

		if (!id) {
			throw new AppError(httpStatus.NOT_FOUND, "Asset Assignment ID not Found");
		}

		const result = await AssetAssignmentService.returnAssetAssignmentService(
			id as string,
			req.body,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Asset returned successfully",
			data: result,
		});
	},
);

// UPDATE ASSIGNMENT
const updateAssetAssignment = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;

		if (!id) {
			throw new AppError(httpStatus.NOT_FOUND, "Asset Assignment ID not Found");
		}

		const result = await AssetAssignmentService.updateAssetAssignmentService(
			id as string,
			req.body,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Asset assignment updated successfully",
			data: result,
		});
	},
);

// DELETE ASSIGNMENT
const deleteAssetAssignment = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;

		if (!id) {
			throw new AppError(httpStatus.NOT_FOUND, "Asset Assignment ID not Found");
		}

		const result = await AssetAssignmentService.deleteAssetAssignmentService(
			id as string,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Asset assignment deleted successfully",
			data: result,
		});
	},
);

// EXPORT
export const AssetAssignmentController = {
	createAssetAssignment,
	getAllAssetAssignments,
	getSingleAssetAssignment,
	returnAssetAssignment,
	updateAssetAssignment,
	deleteAssetAssignment,
};
