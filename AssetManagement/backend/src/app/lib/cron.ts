import cron from "node-cron";
import { DoctorVerificationStatus, Role } from "../../generated/prisma/enums";
import { prisma } from "./prisma";

export const deleteUnverifiedDoctors = async () => {
	cron.schedule("*/10 * * * *", async () => {
		try {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
			const deletedDoctors = await prisma.user.deleteMany({
				where: {
					role: Role.DOCTOR,
					emailVerified: false,
					createdAt: { lt: oneHourAgo },
					doctor: {
						verificationStatus: DoctorVerificationStatus.PENDING,
					},
				},
			});

			if (deletedDoctors.count > 0) {
				console.log(`
                Cron: Deleted ${deletedDoctors.count} unverified email doctor applications older than 1 hour
                `);
			}
		} catch (error) {
			console.log(
				"Cron: Failed to delete unverified doctor applications",
				error,
			);
		}

		console.log("Unverified Doctor Delete cron schedule (every 10 minutes)");
	});
};
export const deleteRejectedDoctors = async () => {
	cron.schedule("*/10 * * * *", async () => {
		try {
			const oneMonthAgo = new Date(Date.now() - 60 * 60 * 24 * 30 * 1000);
			const deletedDoctors = await prisma.user.deleteMany({
				where: {
					role: Role.DOCTOR,
					createdAt: { lt: oneMonthAgo },
					doctor: {
						verificationStatus: DoctorVerificationStatus.REJECTED,
					},
				},
			});

			if (deletedDoctors.count > 0) {
				console.log(`
                Cron: Deleted ${deletedDoctors.count} rejected doctor applications older than 1 hour
                `);
			}
		} catch (error) {
			console.log("Cron: Failed to delete rejected doctor applications", error);
		}

		console.log("Rejected Doctor Delete cron schedule (every 1 month)");
	});
};
