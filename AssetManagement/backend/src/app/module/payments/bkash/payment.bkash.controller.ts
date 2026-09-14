import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../../utils/AppError";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { PaymentBkashService } from "./payment.bkash.service";

const createBkashPayment = catchAsync(async (req: Request, res: Response) => {
	const { purchaseId } = req.params;

	if (typeof purchaseId !== "string" || !purchaseId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Purchase ID is required");
	}

	// Validate authenticated user
	if (!req.user) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User is not authenticated");
	}
	const userId = req.user.userId;

	const result = await PaymentBkashService.createBkashPaymentService(
		purchaseId,
		userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "bKash payment created successfully",
		data: result,
	});
});

const executeBkashPayment = catchAsync(async (req: Request, res: Response) => {
	const { paymentId } = req.params;

	// Validate paymentId
	if (typeof paymentId !== "string" || !paymentId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Payment ID is required");
	}

	if (!req.user) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User is not authenticated");
	}
	const userId = req.user.userId;

	const result = await PaymentBkashService.executeBkashPayment(
		paymentId,
		userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "bKash payment completed successfully",
		data: result,
	});
});

const bkashCallback = catchAsync(async (req: Request, res: Response) => {
	const { paymentID, status, signature, apiVersion } = req.query;

	// Validate paymentID
	if (typeof paymentID !== "string" || !paymentID) {
		throw new AppError(httpStatus.BAD_REQUEST, "bKash paymentID is required");
	}

	// Check bKash callback status
	if (status !== "success") {
		return res.status(httpStatus.BAD_REQUEST).json({
			success: false,
			message: "bKash payment was not successful",
			status,
		});
	}

	// Execute payment using bKash paymentID
	const result =
		await PaymentBkashService.executeBkashPaymentByTransactionId(paymentID);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "bKash payment completed successfully",
		data: result,
	});
});

export const PaymentBkashController = {
	createBkashPayment,
	executeBkashPayment,
	bkashCallback,
};
