import crypto from "node:crypto";
import path from "node:path";

import bcrypt from "bcryptjs";
import ejs from "ejs";
import type { TokenPayload } from "google-auth-library";
import httpStatus from "http-status";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import {
	AuthProvider,
	Role,
	UserStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { googleClient } from "../../lib/googleAuth";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { sendEmail } from "../../lib/sendMail";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import type {
	IForgotPasswordPayload,
	IGoogleLoginPayload,
	ILoginUserPayload,
	IRegisterPatientPayload,
	IRequestUser,
	IResetPasswordPayload,
	IVerifyEmailPayload,
} from "./auth.interface";

const registerPatient = async (payload: IRegisterPatientPayload) => {
	const { name, password, patient: patientData } = payload;
	const email = payload.email.trim().toLowerCase();

	const isUserExists = await prisma.user.findUnique({
		where: { email },
	});

	if (isUserExists) {
		throw new Error("User with this email already exists");
	}

	const hashedPassword = await bcrypt.hash(
		password,
		Number(config.bcrypt_salt_rounds),
	);

	// Data Store in Redis temporary
	const expirationTime = 60 * 5; //5 min
	const otpKey = `patient-registration-otp:${email}`;
	const otpValue = crypto.randomInt(100000, 1000000).toString();

	await redisClient.set(otpKey, otpValue, {
		expiration: {
			type: "EX",
			value: expirationTime,
		},
	});

	const patientRegistrationKey = `patient-registration-data:${email}`;
	const redisUserDataPayload = {
		name,
		email,
		password: hashedPassword,
		patient: patientData,
	};

	await redisClient.set(
		patientRegistrationKey,
		JSON.stringify(redisUserDataPayload),
		{
			expiration: {
				type: "EX",
				value: expirationTime,
			},
		},
	);

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

	sendEmail({
		to: email,
		subject: "Email Verification OTP",
		text: "Text",
		html: html,
	});
};

const verifyPatientEmail = async (payload: IVerifyEmailPayload) => {
	const otp = payload.otp;
	const email = payload.email.trim().toLowerCase();

	const isUserExist = await prisma.user.findUnique({
		where: { email },
	});

	if (isUserExist?.emailVerified) {
		throw new Error("Email already verified.");
	}

	if (isUserExist?.status === UserStatus.BLOCKED) {
		throw new Error("User is Blocked.!");
	}
	if (isUserExist?.status === UserStatus.DELETED) {
		throw new Error("User is Deleted.!");
	}

	const otpKey = `patient-registration-otp:${email}`;
	const redisOtp = await redisClient.get(otpKey);
	if (!redisOtp) {
		throw new Error("Either the OTP was not generated, or it has expired.");
	}
	if (redisOtp !== otp) {
		throw new Error("Invalid OTP.!");
	}

	await redisClient.del(otpKey);

	const patientRegistrationKey = `patient-registration-data:${email}`;
	const redisPatientData = await redisClient.get(patientRegistrationKey);

	if (!redisPatientData) {
		throw new Error("Patient does not exist.");
	}
	const patientPayload: IRegisterPatientPayload = JSON.parse(redisPatientData);

	const createdUser = await prisma.user.create({
		data: {
			name: patientPayload.name,
			email: patientPayload.email,
			password: patientPayload.password,
			role: Role.PATIENT,
			status: UserStatus.ACTIVE,
			emailVerified: true,
			patient: {
				create: {
					name: patientPayload.name,
					email: patientPayload.email,
					contactNumber: patientPayload?.patient?.contactNumber,
				},
			},
		},
		omit: { password: true },
		include: { patient: true },
	});

	await redisClient.del(patientRegistrationKey);

	// Sending Welcome Email
	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/patient-welcome-email.ejs",
	);
	const templateData = {
		patientName: patientPayload.name,
		email: patientPayload.email,
		loginUrl: `${config.frontend_url}/login`,
		supportEmail: "support@gmail.com",
		appName: "RB Healthcare",
		currentYear: new Date().getFullYear(),
	};
	const html = await ejs.renderFile(templatePath, templateData);

	sendEmail({
		to: email,
		subject: "Welcome to RB Healthcare System.",
		text: "Text",
		html: html,
	});

	const { patient, ...user } = createdUser;
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

	return {
		user,
		patient,
		accessToken,
		refreshToken,
	};

	// 	const html = await ejs.renderFile(templatePath, templateData);

	// 	sendEmail({
	// 		to: email,
	// 		subject: "Email verification has been successfully.",
	// 		text: "Text",
	// 		html: html,
	// 	});
};

const loginUser = async (payload: ILoginUserPayload) => {
	const { password } = payload;
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new Error("User is blocked");
	}

	if (user.isDeleted || user.status === UserStatus.DELETED) {
		throw new Error("User is deleted");
	}

	if (user.password === null && user.googleId !== null) {
		throw new Error(
			"User Already Has Account Registered with Google. Try login with google.",
		);
	}

	const isPasswordMatched = await bcrypt.compare(
		password,
		user.password as string,
	);

	if (!isPasswordMatched) {
		throw new Error("Invalid credentials");
	}

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

	return {
		accessToken,
		refreshToken,
	};
};

const getMe = async (user: IRequestUser) => {
	const isUserExists = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
		include: {
			patient: true,
		},
		omit: {
			password: true,
		},
	});

	if (!isUserExists) {
		throw new Error("User not found");
	}

	return isUserExists;
};

const refreshToken = async (token: string) => {
	const verifiedRefreshToken = jwtUtils.verifyToken(
		token,
		config.jwt_refresh_secret,
	);

	if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
		throw new Error(
			config.node_env === "development"
				? verifiedRefreshToken.error
				: "Invalid refresh token",
		);
	}

	const data = verifiedRefreshToken.data as JwtPayload;

	const user = await prisma.user.findUnique({
		where: { id: data.userId },
	});

	if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
		throw new Error("User is inactive or not found");
	}

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

	return {
		accessToken,
		refreshToken,
	};
};

export const googleLoginService = async (payload: IGoogleLoginPayload) => {
	let googleIdTokenPayload: TokenPayload | null | undefined = null;
	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google_client_id,
		});
		googleIdTokenPayload = ticket.getPayload();
	} catch (error) {
		console.log("Google ID Token Verification Failed", error);
		throw new Error("Invalid or Expired Google ID Token.!");
	}

	if (!googleIdTokenPayload) {
		throw new Error("Need Google ID Token.!");
	}
	if (!googleIdTokenPayload.email) {
		throw new Error("Google Email not Found..!");
	}
	if (!googleIdTokenPayload.name) {
		throw new Error("Google Name not Found..!");
	}

	const ifPatientExistWithGoogleAuth = await prisma.user.findUnique({
		where: {
			email: googleIdTokenPayload.email,
			role: Role.PATIENT,
			googleId: googleIdTokenPayload.sub,
		},
	});

	let user = ifPatientExistWithGoogleAuth;

	if (!ifPatientExistWithGoogleAuth) {
		const ifPatientExistWithCredentials = await prisma.user.findUnique({
			where: {
				email: googleIdTokenPayload.email,
				role: Role.PATIENT,
				authProvider: AuthProvider.CREDENTIAL,
			},
		});
		if (ifPatientExistWithCredentials) {
			if (!ifPatientExistWithCredentials.emailVerified) {
				throw new Error("User Email is not Verified.");
			}
			if (ifPatientExistWithCredentials.status === UserStatus.BLOCKED) {
				throw new Error("User is Blocked.");
			}
			if (
				ifPatientExistWithCredentials.isDeleted ||
				ifPatientExistWithCredentials.status === UserStatus.DELETED
			) {
				throw new Error("User is Deleted.");
			}

			user = await prisma.user.update({
				where: {
					id: ifPatientExistWithCredentials.id,
				},
				data: {
					googleId: googleIdTokenPayload.sub,
				},
			});
		} else {
			// Google Register
			user = await prisma.user.create({
				data: {
					name: googleIdTokenPayload.name,
					email: googleIdTokenPayload.email,
					role: Role.PATIENT,
					status: UserStatus.ACTIVE,
					emailVerified: true,
					googleId: googleIdTokenPayload.sub,
					authProvider: AuthProvider.GOOGLE,
					patient: {
						create: {
							name: googleIdTokenPayload.name,
							email: googleIdTokenPayload.email,
						},
					},
				},
			});

			// Sending Welcome Email
			const templatePath = path.join(
				process.cwd(),
				"src/app/templates/patient-welcome-email.ejs",
			);
			const templateData = {
				patientName: user.name,
				email: user.email,
				loginUrl: `${config.frontend_url}/login`,
				supportEmail: "support@gmail.com",
				appName: "RB Healthcare",
				currentYear: new Date().getFullYear(),
			};
			const html = await ejs.renderFile(templatePath, templateData);

			sendEmail({
				to: user.email,
				subject: "Welcome to RB Healthcare System.",
				text: "Text",
				html: html,
			});
		}
	}

	if (!user) {
		throw new Error("User not found.!");
	}
	if (user.status === UserStatus.BLOCKED) {
		throw new Error("User is Blocked.");
	}
	if (user.isDeleted || user.status === UserStatus.DELETED) {
		throw new Error("User is Deleted.");
	}

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

	return {
		accessToken,
		refreshToken,
	};
};

export const forgotPasswordService = async (
	payload: IForgotPasswordPayload,
) => {
	const { email } = payload;
	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});
	if (!isUserExist) {
		throw new Error("User dose not Exist.!");
	}

	if (isUserExist.status === UserStatus.BLOCKED) {
		throw new Error("User is Blocked.!");
	}
	if (isUserExist.status === UserStatus.DELETED) {
		throw new Error("User is Deleted.!");
	}
	if (!isUserExist.emailVerified) {
		throw new Error("User is not verified.!");
	}

	if (isUserExist.googleId || isUserExist.authProvider === "GOOGLE") {
		throw new Error("User has account with google.!");
	}

	const otp = crypto.randomInt(100000, 1000000).toString();
	const key = `forgot-password-otp:${isUserExist.email}`;
	const expirationTime = 60 * 5; //5 min

	await redisClient.set(key, otp, {
		expiration: {
			type: "EX",
			value: expirationTime,
		},
	});

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/forgotPassword.ejs",
	);
	const templateData = {
		name: isUserExist.name,
		expirationTime: expirationTime / 60,
		currentYear: new Date().getFullYear(),
		OTP: otp.split(""),
	};
	const html = await ejs.renderFile(templatePath, templateData);

	sendEmail({
		to: isUserExist.email,
		subject: "Forgot Password's OTP",
		text: "Text",
		html: html,
	});
};

export const resetPasswordService = async (payload: IResetPasswordPayload) => {
	const { email, otp, newPassword } = payload;
	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});
	if (!isUserExist) {
		throw new Error("User dose not Exist.!");
	}

	if (isUserExist.status === UserStatus.BLOCKED) {
		throw new Error("User is Blocked.!");
	}
	if (isUserExist.status === UserStatus.DELETED) {
		throw new Error("User is Deleted.!");
	}
	if (!isUserExist.emailVerified) {
		throw new Error("User is not verified.!");
	}

	if (isUserExist.googleId || isUserExist.authProvider === "GOOGLE") {
		throw new Error("User has account with google.!");
	}

	const key = `forgot-password-otp:${isUserExist.email}`;
	const redisOtp = await redisClient.get(key);
	if (!redisOtp) {
		throw new Error("Either the OTP was not generated, or it has expired.");
	}
	if (redisOtp !== otp) {
		throw new Error("Invalid OTP.!");
	}

	const hashedNewPassword = await bcrypt.hash(
		newPassword,
		Number(config.bcrypt_salt_rounds),
	);
	await prisma.user.update({
		where: {
			email: isUserExist.email,
		},
		data: {
			password: hashedNewPassword,
		},
	});

	await redisClient.del([key]);

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/resetPasswordSuccess.ejs",
	);
	const templateData = {
		userName: isUserExist.name,
		loginUrl: `${config.frontend_url}/login`,
		appName: "RB Health Care",
		currentYear: new Date().getFullYear(),
		resetTime: new Date().toLocaleString("en-US", {
			dateStyle: "medium",
			timeStyle: "short",
		}),
	};

	const html = await ejs.renderFile(templatePath, templateData);

	sendEmail({
		to: isUserExist.email,
		subject: "Password has been reset successful.",
		text: "Text",
		html: html,
	});

	return;
};

export const AuthService = {
	registerPatient,
	verifyPatientEmail,
	loginUser,
	getMe,
	refreshToken,
	googleLoginService,
	forgotPasswordService,
	resetPasswordService,
};
