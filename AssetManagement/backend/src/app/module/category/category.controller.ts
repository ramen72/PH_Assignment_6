import type { Request, Response } from "express";
import httpStatus from "http-status";

import { AssetCategoryService } from "./category.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

/**
 * Create Asset Category
 */
const createAssetCategory = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await AssetCategoryService.createAssetCategory(payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Asset category created successfully",
		data: result,
	});
});

/**
 * Get All Asset Categories
 */
const getAllAssetCategories = catchAsync(
	async (req: Request, res: Response) => {
		const result = await AssetCategoryService.getAllAssetCategories();

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Asset categories retrieved successfully",
			data: result,
		});
	},
);

/**
 * Get Single Asset Category
 */
const getSingleAssetCategory = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;

		const result = await AssetCategoryService.getSingleAssetCategory(
			id as string,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Asset category retrieved successfully",
			data: result,
		});
	},
);

/**
 * Update Asset Category
 */
const updateAssetCategory = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;
	const payload = req.body;

	const result = await AssetCategoryService.updateAssetCategory(
		id as string,
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Asset category updated successfully",
		data: result,
	});
});

/**
 * Delete Asset Category
 */
const deleteAssetCategory = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	await AssetCategoryService.deleteAssetCategory(id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Asset category deleted successfully",
		data: null,
	});
});

export const AssetCategoryController = {
	createAssetCategory,
	getAllAssetCategories,
	getSingleAssetCategory,
	updateAssetCategory,
	deleteAssetCategory,
};
