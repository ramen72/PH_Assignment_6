import crypto from "node:crypto";
import path from "node:path";

import bcrypt from "bcryptjs";
import ejs from "ejs";
import type { TokenPayload } from "google-auth-library";
import type { SignOptions } from "jsonwebtoken";

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
	IGoogleLoginPayload,
	IUserRegisterPayload,
	IVerifyEmailPayload,
} from "./auth.interface";

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
		throw new Error("User with this email already exists");
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
		throw new Error("Email already verified.");
	}

	if (existingUser?.status === UserStatus.BLOCKED) {
		throw new Error("User is Blocked.");
	}

	if (existingUser?.status === UserStatus.DELETED) {
		throw new Error("User is Deleted.");
	}

	// ==============================
	// Verify OTP
	// ==============================

	const otpKey = `user-registration-otp:${email}`;

	const redisOtp = await redisClient.get(otpKey);

	if (!redisOtp) {
		throw new Error("Either the OTP was not generated, or it has expired.");
	}

	if (redisOtp !== otp) {
		throw new Error("Invalid OTP.");
	}

	// Delete OTP after successful verification
	await redisClient.del(otpKey);

	// ==============================
	// Get Registration Data
	// ==============================

	const userRegistrationKey = `user-registration-data:${email}`;

	const redisUserData = await redisClient.get(userRegistrationKey);

	if (!redisUserData) {
		throw new Error("User registration data does not exist.");
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

		throw new Error("Invalid or expired Google ID Token.");
	}

	// ==========================================
	// 2. Validate Google Payload
	// ==========================================
	if (!googleIdTokenPayload) {
		throw new Error("Google ID Token payload not found.");
	}

	if (!googleIdTokenPayload.sub) {
		throw new Error("Google User ID not found.");
	}

	if (!googleIdTokenPayload.email) {
		throw new Error("Google email not found.");
	}

	if (!googleIdTokenPayload.name) {
		throw new Error("Google name not found.");
	}

	if (googleIdTokenPayload.email_verified !== true) {
		throw new Error("Google email is not verified.");
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
			throw new Error("This email is not registered as an employee.");
		}

		// ------------------------------------------
		// Check Deleted
		// ------------------------------------------
		if (existingUser.isDeleted || existingUser.status === UserStatus.DELETED) {
			throw new Error("User is deleted.");
		}

		// ------------------------------------------
		// Check Blocked
		// ------------------------------------------
		if (existingUser.status === UserStatus.BLOCKED) {
			throw new Error("User is blocked.");
		}

		// ==========================================
		// Existing Google User
		// ==========================================
		if (existingUser.googleId) {
			// Different Google account using same email
			if (existingUser.googleId !== googleId) {
				throw new Error(
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
				throw new Error(
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
		throw new Error("User not found.");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new Error("User is blocked.");
	}

	if (user.isDeleted || user.status === UserStatus.DELETED) {
		throw new Error("User is deleted.");
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

export const AuthService = {
	userRegisterService,
	verifyUserEmailService,
	googleLoginService,
};
