import httpStatus from 'http-status';
import { AppError } from "./AppError";

export const getDateFromDuration = (duration: string): Date => {
	const match = duration.match(/^(\d+)([smhd])$/);
	if (!match) {
		throw new AppError( httpStatus.BAD_REQUEST, `Invalid duration format: ${duration}`, );
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
