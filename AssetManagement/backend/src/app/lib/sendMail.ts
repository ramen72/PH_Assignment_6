import httpStatus from "http-status";
import nodemailer from "nodemailer";

import config from "../config";
import { AppError } from "../utils/AppError";

export const transporter = nodemailer.createTransport({
	host: "mail.devsramen.com",
	port: 587,
	secure: false, // true for 465, false for other ports
	auth: {
		user: config.sending_mail_id,
		pass: config.sending_mail_password,
	},
});

type SendEmailOptions = {
	to: string;
	subject: string;
	html: string;
	text?: string;
};

export const sendEmail = async ({
	to,
	subject,
	text,
	html,
}: SendEmailOptions) => {
	try {
		const info = await transporter.sendMail({
			from: `"SOCIAL MEDIA APP" <${process.env.SENDING_MAIL_ID}>`,
			to,
			subject,
			html,
			text,
		});
		return info;
	} catch (error: any) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Email could not be sent: ${error.message}`,
		);
	}
};
