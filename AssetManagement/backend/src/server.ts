import app from "./app";
import config from "./app/config";
import { deleteRejectedDoctors, deleteUnverifiedDoctors } from "./app/lib/cron";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import { transporter } from "./app/lib/sendMail";
import {
	seedSuperAdmin,
	seedTesterAdmin,
	seedTesterDoctor,
} from "./app/utils/seed";

const PORT = config.port;

const main = async () => {
	try {
		await prisma.$connect();
		console.log("Database connected to the successfully.");

		await redisClient.connect();
		console.log("REDIS database connected to the successfully.");

		await transporter.verify();
		console.log("Nodemailer connected successfully.");

		// seedSuperAdmin();
		// seedTesterAdmin();
		// seedTesterDoctor();
		// await deleteUnverifiedDoctors();
		// await deleteRejectedDoctors();

		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
};

main();
