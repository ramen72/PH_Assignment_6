import type { Request, Response } from "express";
import httpStatus from "http-status";

import { VendorService } from "./vendor.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

/**
 * Create Vendor
 */
const createVendor = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await VendorService.createVendor(payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Vendor created successfully",
		data: result,
	});
});

/**
 * Get All Vendors
 */
const getAllVendors = catchAsync(async (req: Request, res: Response) => {
	const result = await VendorService.getAllVendors();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendors retrieved successfully",
		data: result,
	});
});

/**
 * Get Single Vendor
 */
const getSingleVendor = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	const result = await VendorService.getSingleVendor(id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendor retrieved successfully",
		data: result,
	});
});

/**
 * Update Vendor
 */
const updateVendor = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;
	const payload = req.body;

	const result = await VendorService.updateVendor(id as string, payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendor updated successfully",
		data: result,
	});
});

/**
 * Delete Vendor
 */
const deleteVendor = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	await VendorService.deleteVendor(id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendor deleted successfully",
		data: null,
	});
});

/**
 * Activate Vendor
 */
const activateVendor = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	const result = await VendorService.activateVendor(id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendor activated successfully",
		data: result,
	});
});

/**
 * Deactivate Vendor
 */
const deactivateVendor = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	const result = await VendorService.deactivateVendor(id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendor deactivated successfully",
		data: result,
	});
});

export const VendorController = {
	createVendor,
	getAllVendors,
	getSingleVendor,
	updateVendor,
	deleteVendor,
	activateVendor,
	deactivateVendor,
};
