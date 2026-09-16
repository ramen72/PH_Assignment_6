import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { z } from "zod";

import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

export const validateRequest = (zodSchema: z.ZodType) => {
	return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
		const payload = {
			body: req.body,
			params: req.params,
			query: req.query,
		};

		const result = zodSchema.safeParse(payload);

		if (!result.success) {
			console.log("Validation errors:", result.error.issues);

			throw new AppError(
				httpStatus.BAD_REQUEST,
				result.error.issues[0]?.message || "Validation failed",
			);
		}

		const validatedData = result.data as {
			body?: unknown;
			params?: unknown;
			query?: unknown;
		};

		if (validatedData.body !== undefined) {
			req.body = validatedData.body;
		}

		if (validatedData.params !== undefined) {
			req.params = validatedData.params as typeof req.params;
		}

		if (validatedData.query !== undefined) {
			req.query = validatedData.query as typeof req.query;
		}

		next();
	});
};
