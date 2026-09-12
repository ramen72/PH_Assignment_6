import type { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AssetService } from "./asset.service";

// CREATE
const createAsset = catchAsync(async (req: Request, res: Response) => {
	const result = await AssetService.createAsset(req.body);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Asset created successfully",
		data: result,
	});
});

// GET ALL
const getAllAssets = catchAsync(async (req: Request, res: Response) => {
	const result = await AssetService.getAllAssetsService(req.query, {
		page: Number(req.query.page) || 1,
		limit: Number(req.query.limit) || 10,

		sortBy: typeof req.query.sortBy === "string" ? req.query.sortBy : undefined,

		sortOrder:
			req.query.sortOrder === "asc" || req.query.sortOrder === "desc"
				? req.query.sortOrder
				: undefined,
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Assets retrieved successfully",
		meta: {
			...result.meta,
			totalPages: result.meta.totalPage,
		},
		data: result.data,
	});
});

// GET SINGLE
const getSingleAsset = catchAsync(async (req: Request, res: Response) => {
	const result = await AssetService.getSingleAssetService(
		req.params.id as string,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Asset retrieved successfully",
		data: result,
	});
});

// UPDATE
const updateAsset = catchAsync(async (req: Request, res: Response) => {
	const result = await AssetService.updateAssetService(
		req.params.id as string,
		req.body,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Asset updated successfully",
		data: result,
	});
});

// DELETE
const deleteAsset = catchAsync(async (req: Request, res: Response) => {
	const result = await AssetService.deleteAssetService(req.params.id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Asset deleted successfully",
		data: result,
	});
});

// EXPORT
export const AssetController = {
	createAsset,
	getAllAssets,
	getSingleAsset,
	updateAsset,
	deleteAsset,
};
