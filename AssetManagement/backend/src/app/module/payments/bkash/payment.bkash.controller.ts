import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../../utils/AppError";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { PaymentBkashService } from "./payment.bkash.service";
import config from "../../../config";

const createBkashPayment = catchAsync(async (req: Request, res: Response) => {
	const { purchaseId } = req.params;

	if (typeof purchaseId !== "string" || !purchaseId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Purchase ID is required");
	}

	// Validate authenticated user
	if (!req.user) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User is not authenticated");
	}
	console.log(req.user)
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
console.log("executeBkashPayment:",result)
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "bKash payment completed successfully",
		data: result,
	});
});

const bkashCallback = catchAsync(
  async (req: Request, res: Response) => {
	const { paymentID, status } = req.query;

	// Helper: redirect the user back to the frontend.
	const redirectToFrontend = (
	  callbackStatus: "success" | "failed" | "pending",
	  paymentId?: string,
	) => {
	  const callbackUrl = new URL(
		"/payment/bkash/callback",
		config.frontend_url,
	  );

	  callbackUrl.searchParams.set("status", callbackStatus);

	  if (paymentId) {
		callbackUrl.searchParams.set("paymentID", paymentId);
	  }

	  return res.redirect(302, callbackUrl.toString());
	};

	// Validate paymentID.
	if (typeof paymentID !== "string" || !paymentID.trim()) {
	  return redirectToFrontend("failed");
	}

	// Validate the callback status.
	if (status !== "success") {
	  return redirectToFrontend("failed", paymentID);
	}

	try {
	  // Execute and verify payment on the backend.
	  const result =
		await PaymentBkashService.executeBkashPaymentByTransactionId(
		  paymentID,
		);

	  console.log("bKash callback result:", result);

	  // Redirect according to the verified payment status.
	  if (result.paymentStatus === "PAID") {
		return redirectToFrontend("success", paymentID);
	  }

	  if (result.paymentStatus === "FAILED") {
		return redirectToFrontend("failed", paymentID);
	  }

	  return redirectToFrontend("pending", paymentID);
	} catch (error) {
	  console.error("bKash callback error:", error);

	  return redirectToFrontend("failed", paymentID);
	}
  },
);
const getSinglePaymentByAssetPurchasesId = catchAsync(
  async (req: Request, res: Response) => {
	const { purchaseId } = req.params;
	console.log(purchaseId)
	const result = await PaymentBkashService.getSinglePaymentByAssetPurchaseIdService(purchaseId as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Asset created successfully",
		data: result,
	});
  }
);


export const PaymentBkashController = {
	createBkashPayment,
	executeBkashPayment,
	bkashCallback,
	getSinglePaymentByAssetPurchasesId
};


export default bkashCallback;
