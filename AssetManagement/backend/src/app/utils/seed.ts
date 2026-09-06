import bcrypt from "bcryptjs";
import { UserRole } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import httpStatus from 'http-status';
import { AppError } from "./AppError";

export const seedSuperAdmin = async () => {
	try {
		const isSuperAdmin = await prisma.user.findFirst({
			where: {
				role: UserRole.SUPER_ADMIN,
			},
		});

		if (isSuperAdmin) {
			console.log("Super Admin Already Exist.");
			return;
		}

		const name = config.super_admin_name;
		const email = config.super_admin_email;
		const password = config.super_admin_password;

		if (!name || !email || !password) {
			throw new AppError(httpStatus.BAD_REQUEST,
				"Super Admin Name or Email or Password is missing in env file.!",
			);
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const superAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: UserRole.SUPER_ADMIN,
				needPasswordChange: false,
				emailVerified: true,
			},
		});

		console.log("Super Admin created: ", superAdmin);
	} catch (error) {
		console.log("Error seeding Super Admin user : ", error);

		await prisma.user.delete({
			where: {
				email: config.super_admin_email,
			},
		});
	}
};

export const seedTesterAdmin = async () => {
	try {
		const isSuperAdmin = await prisma.user.findUnique({
			where: {
				email: config.tester_admin_email,
			},
		});

		if (isSuperAdmin) {
			console.log("Tester Admin Already Exist.");
			return;
		}

		const name = config.tester_admin_name;
		const email = config.tester_admin_email;
		const password = config.tester_admin_password;

		if (!name || !email || !password) {
			throw new AppError(httpStatus.BAD_REQUEST,
				"Tester Admin Name or Email or Password is missing in env file.!",
			);
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const testerAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: UserRole.ADMIN,
				needPasswordChange: false,
				emailVerified: true,
			},
		});

		console.log("Tester Admin created: ", testerAdmin);
	} catch (error) {
		console.log("Error seeding Tester Admin user : ", error);

		await prisma.user.delete({
			where: {
				email: config.tester_admin_email,
			},
		});
	}
};

export const seedTesterDoctor = async () => {
	try {
		const isSuperDoctor = await prisma.user.findUnique({
			where: {
				email: config.tester_doctor_email,
			},
		});

		if (isSuperDoctor) {
			console.log("Tester Doctor Already Exist.");
			return;
		}

		const name = config.tester_doctor_name;
		const email = config.tester_doctor_email;
		const password = config.tester_doctor_password;

		if (!name || !email || !password) {
			throw new AppError(httpStatus.BAD_REQUEST,
				"Tester Doctor Name or Email or Password is missing in env file.!",
			);
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const testerDoctor = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: UserRole.ADMIN,
				needPasswordChange: false,
				emailVerified: true,
				doctor: {
					create: {
						name,
						email,
						experienceYears: 5,
						licenseNumber: "MBS42DEI345C",
						qualifications: "MBBS",
						specialization: "Neurology",
					},
				},
			},
		});

		console.log("Tester Doctor created: ", testerDoctor);
	} catch (error) {
		console.log("Error seeding Tester Doctor user : ", error);

		await prisma.user.delete({
			where: {
				email: config.tester_doctor_email,
			},
		});
	}
};
