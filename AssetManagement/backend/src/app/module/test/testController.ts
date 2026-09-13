import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import z, { email } from "zod";
import { BkashService } from "../payments/bkash/bkash.service";

const testOne = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const UserZodSchema = z.object({
			name: z.string().min(2),
			email: email(),
			age: z.number().optional(),
			isVerified: z.boolean().optional(),
			books: z.array(z.string()).optional(),
		});

		const payload = req.body;
		const result = UserZodSchema.safeParse(payload);
		if (!result.success) {
			console.log(result.error);
		} else {
			console.log(result.data);
		}

		res.status(httpStatus.OK).json({
			success: true,
			message: "Welcome to PH Healthcare System Backend",
			data: result,
		});
	} catch (error) {
		console.log(error);
		next(error);
	}
};

const bkashTokenController = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const bkashToken = await BkashService.getBkashToken()
		console.log(bkashToken)
	} catch (error) {
		console.log(error);
		next(error);
	}
};

export const TestController = {
	testOne,
	bkashTokenController
};
