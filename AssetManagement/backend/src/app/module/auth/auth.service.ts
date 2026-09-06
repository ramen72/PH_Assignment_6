import crypto from "node:crypto";
import path from "node:path";

import bcrypt from "bcryptjs";
import ejs from "ejs";
import type { TokenPayload } from "google-auth-library";
import type { SignOptions } from "jsonwebtoken";

import httpStatus from 'http-status';
import {
	AuthProvider,
	UserRole,
	UserStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { googleClient } from "../../lib/googleAuth";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { sendEmail } from "../../lib/sendMail";
import { jwtUtils } from "../../utils/jwt";
import type {
  IForgotPasswordPayload,
	IGoogleLoginPayload,
	IUserRegisterPayload,
	IVerifyEmailPayload,
} from "./auth.interface";
import { AppError } from "../../utils/AppError";

const userRegisterService = async (payload: IUserRegisterPayload) => {
	const { name, password, phone, department, designation, profile } = payload;

	const email = payload.email.trim().toLowerCase();

	// Check existing user
	const isUserExists = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (isUserExists) {
		throw new AppError(httpStatus.CONFLICT,"User with this email already exists");
	}

	// Hash password
	const hashedPassword = await bcrypt.hash(
		password,
		Number(config.bcrypt_salt_rounds),
	);

	// OTP expiration: 5 minutes
	const expirationTime = 60 * 5;

	// Generate 6 digit OTP
	const otpValue = crypto.randomInt(100000, 1000000).toString();

	// ============================
	// Store OTP in Redis
	// ============================

	const otpKey = `user-registration-otp:${email}`;

	await redisClient.set(otpKey, otpValue, {
		expiration: {
			type: "EX",
			value: expirationTime,
		},
	});

	// ============================
	// Store Registration Data
	// ============================

	const userRegistrationKey = `user-registration-data:${email}`;

	const redisUserDataPayload = {
		name,
		email,
		password: hashedPassword,
		phone,
		department,
		designation,
		profile: profile ?? null,
	};

	console.log(redisUserDataPayload);

	await redisClient.set(
		userRegistrationKey,
		JSON.stringify(redisUserDataPayload),
		{
			expiration: {
				type: "EX",
				value: expirationTime,
			},
		},
	);

	// ============================
	// Email OTP
	// ============================

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/registrationOTP.ejs",
	);

	const templateData = {
		name,
		expirationTime: expirationTime / 60,
		currentYear: new Date().getFullYear(),
		OTP: otpValue.split(""),
	};

	const html = await ejs.renderFile(templatePath, templateData);

	await sendEmail({
		to: email,
		subject: "Email Verification OTP",
		text: `Your email verification OTP is ${otpValue}`,
		html,
	});

	return {
		message:
			"Registration initiated successfully. Please check your email for the verification OTP.",
	};
};

const verifyUserEmailService = async (payload: IVerifyEmailPayload) => {
	const otp = payload.otp;
	const email = payload.email.trim().toLowerCase();

	// Check user existence
	const existingUser = await prisma.user.findUnique({
		where: { email },
	});

	if (existingUser?.emailVerified) {
		throw new AppError(httpStatus.CONFLICT,"Email already verified.");
	}

	if (existingUser?.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.FORBIDDEN,"User is Blocked.");
	}

	if (existingUser?.status === UserStatus.DELETED) {
		throw new AppError(httpStatus.GONE,"User is Deleted.");
	}

	// ==============================
	// Verify OTP
	// ==============================

	const otpKey = `user-registration-otp:${email}`;

	const redisOtp = await redisClient.get(otpKey);

	if (!redisOtp) {
		throw new AppError(httpStatus.UNAUTHORIZED,"Either the OTP was not generated, or it has expired.");
	}

	if (redisOtp !== otp) {
		throw new AppError(httpStatus.UNAUTHORIZED,"Invalid OTP.");
	}

	// Delete OTP after successful verification
	await redisClient.del(otpKey);

	// ==============================
	// Get Registration Data
	// ==============================

	const userRegistrationKey = `user-registration-data:${email}`;

	const redisUserData = await redisClient.get(userRegistrationKey);

	if (!redisUserData) {
		throw new AppError(httpStatus.NOT_FOUND,"User registration data does not exist.");
	}
	console.log(redisUserData);

	const userPayload: IUserRegisterPayload = JSON.parse(redisUserData);

	// ==============================
	// Create User + UserProfile
	// ==============================

	const createdUser = await prisma.user.create({
		data: {
			name: userPayload.name,
			email: userPayload.email.trim().toLowerCase(),
			password: userPayload.password,

			// User fields
			phone: userPayload.phone,
			department: userPayload.department,
			designation: userPayload.designation,

			role: UserRole.EMPLOYEE,
			status: UserStatus.ACTIVE,
			authProvider: AuthProvider.EMAIL,

			emailVerified: true,
			isActive: true,
			needPasswordChange: false,
			isDeleted: false,

			// User Profile
			profile: {
				create: {
					bio: userPayload.profile?.bio,
					address: userPayload.profile?.address,
					city: userPayload.profile?.city,
					postalCode: userPayload.profile?.postalCode,
					country: userPayload.profile?.country ?? "Bangladesh",

					dateOfBirth: userPayload.profile?.dateOfBirth
						? new Date(userPayload.profile.dateOfBirth)
						: undefined,

					emergencyContactName: userPayload.profile?.emergencyContactName,

					emergencyContactPhone: userPayload.profile?.emergencyContactPhone,

					joiningDate: userPayload.profile?.joiningDate
						? new Date(userPayload.profile.joiningDate)
						: undefined,

					employeeId: userPayload.profile?.employeeId,
				},
			},
		},

		omit: {
			password: true,
		},

		include: {
			profile: true,
		},
	});

	// Delete registration data from Redis
	await redisClient.del(userRegistrationKey);

	// ==============================
	// Sending Welcome Email
	// ==============================

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/user-welcome-email.ejs",
	);

	const templateData = {
		userName: userPayload.name,
		email: userPayload.email,
		loginUrl: `${config.frontend_url}/login`,
		supportEmail: "support@gmail.com",
		appName: "Asset Management System",
		currentYear: new Date().getFullYear(),
	};

	const html = await ejs.renderFile(templatePath, templateData);

	sendEmail({
		to: email,
		subject: "Welcome to Asset Management System.",
		text: "Welcome to Asset Management System.",
		html,
	});

	// ==============================
	// Generate JWT Tokens
	// ==============================

	const { profile, ...user } = createdUser;

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	// ==============================
	// Return Response
	// ==============================

	return {
		user,
		profile,
		accessToken,
		refreshToken,
	};
};

export const googleLoginService = async (payload: IGoogleLoginPayload) => {
	let googleIdTokenPayload: TokenPayload | null | undefined = null;

	// ==========================================
	// 1. Verify Google ID Token
	// ==========================================
	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google_client_id,
		});

		googleIdTokenPayload = ticket.getPayload();
	} catch (error) {
		console.error("Google ID Token Verification Failed:", error);

		throw new AppError(httpStatus.UNAUTHORIZED,"Invalid or expired Google ID Token.");
	}

	// ==========================================
	// 2. Validate Google Payload
	// ==========================================
	if (!googleIdTokenPayload) {
		throw new AppError(httpStatus.NOT_FOUND,"Google ID Token payload not found.");
	}

	if (!googleIdTokenPayload.sub) {
		throw new AppError(httpStatus.NOT_FOUND,"Google User ID not found.");
	}

	if (!googleIdTokenPayload.email) {
		throw new AppError(httpStatus.NOT_FOUND,"Google email not found.");
	}

	if (!googleIdTokenPayload.name) {
		throw new AppError(httpStatus.NOT_FOUND,"Google name not found.");
	}

	if (googleIdTokenPayload.email_verified !== true) {
		throw new AppError(httpStatus.UNAUTHORIZED,"Google email is not verified.");
	}

	const email = googleIdTokenPayload.email.trim().toLowerCase();

	const googleId = googleIdTokenPayload.sub;
	const name = googleIdTokenPayload.name;

	// ==========================================
	// 3. Find Existing User by Email
	// ==========================================
	const existingUser = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	let user: any = null;

	// ==========================================
	// 4. Existing User
	// ==========================================
	if (existingUser) {
		// ------------------------------------------
		// Check Role
		// ------------------------------------------
		if (existingUser.role !== UserRole.EMPLOYEE) {
			throw new AppError(httpStatus.UNAUTHORIZED,"This email is not registered as an employee.");
		}

		// ------------------------------------------
		// Check Deleted
		// ------------------------------------------
		if (existingUser.isDeleted || existingUser.status === UserStatus.DELETED) {
			throw new AppError(httpStatus.GONE,"User is deleted.");
		}

		// ------------------------------------------
		// Check Blocked
		// ------------------------------------------
		if (existingUser.status === UserStatus.BLOCKED) {
			throw new AppError(httpStatus.FORBIDDEN,"User is blocked.");
		}

		// ==========================================
		// Existing Google User
		// ==========================================
		if (existingUser.googleId) {
			// Different Google account using same email
			if (existingUser.googleId !== googleId) {
				throw new AppError(httpStatus.CONFLICT,
					"This email is already linked with another Google account.",
				);
			}

			user = existingUser;
		}

		// ==========================================
		// Existing Email/Password User
		// ==========================================
		else {
			// Email/password account must be verified
			if (!existingUser.emailVerified) {
				throw new AppError(httpStatus.FORBIDDEN,
					"User email is not verified. Please verify your email first.",
				);
			}

			// Link Google account
			user = await prisma.user.update({
				where: {
					id: existingUser.id,
				},
				data: {
					googleId,
				},
			});
		}
	}

	// ==========================================
	// 5. New Google User Registration
	// ==========================================
	else {
		user = await prisma.user.create({
			data: {
				name,
				email,
				emailVerified: true,
				googleId,
				authProvider: AuthProvider.GOOGLE,
				role: UserRole.EMPLOYEE,
				status: UserStatus.ACTIVE,
				profile: {
					create: {
						country: "Bangladesh",
					},
				},
			},
		});

		// ========================================
		// Send Welcome Email
		// ========================================
		const templatePath = path.join(
			process.cwd(),
			"src/app/templates/user-welcome-email.ejs",
		);

		const templateData = {
			userName: user.name,
			email: user.email,
			loginUrl: `${config.frontend_url}/login`,
			supportEmail: "support@gmail.com",
			appName: "RB Healthcare",
			currentYear: new Date().getFullYear(),
		};

		const html = await ejs.renderFile(templatePath, templateData);

		await sendEmail({
			to: user.email,
			subject: "Welcome to RB Healthcare System",
			text: `Welcome to RB Healthcare System, ${user.name}.`,
			html,
		});
	}

	// ==========================================
	// 6. Final User Validation
	// ==========================================
	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND,"User not found.");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.UNAUTHORIZED,"User is blocked.");
	}

	if (user.isDeleted || user.status === UserStatus.DELETED) {
		throw new AppError(httpStatus.GONE,"User is deleted.");
	}

	// ==========================================
	// 7. Create JWT Payload
	// ==========================================
	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	// ==========================================
	// 8. Access Token
	// ==========================================
	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	// ==========================================
	// 9. Refresh Token
	// ==========================================
	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	// ==========================================
	// 10. Return Tokens
	// ==========================================
	return {
		accessToken,
		refreshToken,
	};
};

export const forgotPasswordService = async (
	payload: IForgotPasswordPayload,
) => {
	const { email } = payload;

	// Find user
	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	// User does not exist
	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND,"User does not exist!");
	}

	// User is blocked
	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.UNAUTHORIZED,"User is blocked!");
	}

	// User is deleted
	if (user.status === UserStatus.DELETED || user.isDeleted) {
		throw new AppError(httpStatus.GONE,"User is deleted!");
	}

	// User is inactive
	if (!user.isActive) {
		throw new AppError(httpStatus.FORBIDDEN,"User account is inactive!");
	}

	// Email is not verified
	if (!user.emailVerified) {
		throw new AppError(httpStatus.FORBIDDEN,"User email is not verified!");
	}

	// Google account cannot use normal password reset
	if (user.googleId || user.authProvider === AuthProvider.GOOGLE) {
		throw new AppError(httpStatus.FORBIDDEN,
			"Password reset is not available for Google accounts!",
		);
	}

	// Generate 6 digit OTP
	const otp = crypto.randomInt(100000, 1000000).toString();

	// Redis key
	const key = `forgot-password-otp:${user.email}`;

	// OTP expiration: 5 minutes
	const expirationTime = 60 * 5;

	// Store OTP in Redis
	await redisClient.set(key, otp, {
		expiration: {
			type: "EX",
			value: expirationTime,
		},
	});

	// Email template path
	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/forgotPassword.ejs",
	);

	// Template data
	const templateData = {
		name: user.name,
		expirationTime: expirationTime / 60,
		currentYear: new Date().getFullYear(),
		OTP: otp.split(""),
	};

	// Render email template
	const html = await ejs.renderFile(
		templatePath,
		templateData,
	);

	// Send OTP email
	await sendEmail({
		to: user.email,
		subject: "Forgot Password's OTP",
		text: `Your password reset OTP is ${otp}. It will expire in 5 minutes.`,
		html,
	});
};

export const AuthService = {
	userRegisterService,
	verifyUserEmailService,
	googleLoginService,
  forgotPasswordService
};
