import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import type { ZodObject, ZodRawShape } from "zod";

import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

export const validateRequest = (zodSchema: ZodObject<ZodRawShape>) => {
	return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
		const payload = {
			body: req.body,
			params: req.params,
			query: req.query,
		};

		const result = zodSchema.safeParse(payload);

		if (!result.success) {
			console.log("Validation Error:", result.error.issues);

			throw new AppError(
				httpStatus.BAD_REQUEST,
				result.error.issues[0]?.message || "Validation failed",
			);
		}

		req.body = result.data.body ?? req.body;

		next();
	});
};
