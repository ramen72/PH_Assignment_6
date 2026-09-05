import crypto from "node:crypto";
import path from "node:path";

import bcrypt from "bcryptjs";
import ejs from "ejs";

import config from "../../config";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { IUserRegisterPayload } from "./auth.interface";
import { sendEmail } from "../../lib/sendMail";

const userRegisterService = async (
  payload: IUserRegisterPayload,
) => {
  const {
    name,
    password,
    phone,
    department,
    designation,
    profile,
  } = payload;

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
  const otpValue = crypto
    .randomInt(100000, 1000000)
    .toString();

  // ============================
  // Store OTP in Redis
  // ============================

  const otpKey = `user-registration-otp:${email}`;

  await redisClient.set(
    otpKey,
    otpValue,
    {
      expiration: {
        type: "EX",
        value: expirationTime,
      },
    },
  );

  // ============================
  // Store Registration Data
  // ============================

  const userRegistrationKey =
    `user-registration-data:${email}`;

  const redisUserDataPayload = {
    name,
    email,
    password: hashedPassword,
    phone,
    department,
    designation,
    profile,
  };

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

  const html = await ejs.renderFile(
    templatePath,
    templateData,
  );

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

export const AuthService = {
  userRegisterService,
};