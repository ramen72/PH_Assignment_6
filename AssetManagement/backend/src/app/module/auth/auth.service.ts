import crypto from "node:crypto";
import path from "node:path";

import bcrypt from "bcryptjs";
import ejs from "ejs";

import config from "../../config";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { IUserRegisterPayload, IVerifyEmailPayload } from "./auth.interface";
import { sendEmail } from "../../lib/sendMail";
import { jwtUtils } from "../../utils/jwt";
import { SignOptions } from "jsonwebtoken";
import {
	AuthProvider,
	UserRole,
	UserStatus,
} from "../../../generated/prisma/enums";

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

export const AuthService = {
	userRegisterService,
	verifyUserEmailService,
};
