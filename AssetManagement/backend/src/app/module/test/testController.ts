import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import z, { email } from "zod";
import { getBkashIdToken } from "../../lib/bkash";
import { redisClient } from "../../lib/redis";
import config from "../../config";

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
const testTwo = async (req: Request, res: Response, next: NextFunction) => {
	try {
		await redisClient.set("forgot-password-otp:patient@gmail.com", "123456", {
			expiration: {
				type: "EX",
				value: 60,
			},
		});

		res.status(httpStatus.OK).json({
			success: true,
			message: "Welcome to PH Healthcare System Backend",
			data: {},
		});
	} catch (error) {
		console.log(error);
		next(error);
	}
};
const testThree = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const otp = crypto.randomInt(100000, 1000000);

		res.status(httpStatus.OK).json({
			success: true,
			message: "Welcome to PH Healthcare System Backend",
			data: otp,
		});
	} catch (error) {
		console.log(error);
		next(error);
	}
};
const testFour = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const grandIdTokenResult = await getBkashIdToken();
		console.log(grandIdTokenResult);

		res.status(httpStatus.OK).json({
			success: true,
			message: "Welcome to PH Healthcare System Backend",
			data: grandIdTokenResult,
		});
	} catch (error) {
		console.log(error);
		next(error);
	}
};
const testFive = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const getDateFromDuration = (expiresIn: string): Date => {
			console.log(expiresIn);

			const match = expiresIn.match(/^(\d+)([smhd])$/);
			if (!match) {
				throw new Error(`Invalid expiration format: ${expiresIn}`);
			}
			const value = Number(match[1]);
			const unit = match[2];
			const unitInMilliseconds: Record<string, number> = {
				s: 1000,
				m: 60 * 1000,
				h: 60 * 60 * 1000,
				d: 24 * 60 * 60 * 1000,
			};
			const milliseconds = unitInMilliseconds[unit];
			return new Date(Date.now() + value * milliseconds);
		};

		const refreshTokenExpiresAt = getDateFromDuration("1m");

		res.status(httpStatus.OK).json({
			success: true,
			message: "Welcome to PH Healthcare System Backend",
			data: refreshTokenExpiresAt,
		});
	} catch (error) {
		console.log(error);
		next(error);
	}
};

export const TestController = {
	testOne,
	testTwo,
	testThree,
	testFour,
	testFive,
};
