import type { UserRole } from "../../../generated/prisma/browser";

export interface ILoginUserPayload {
	email: string;
	password: string;
}

export interface IRegisterPatientPayload {
	name: string;
	email: string;
	password: string;
	patient?: {
		contactNumber?: string;
	};
}

export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}

export interface IRequestUser {
	userId: string;
	name: string;
	email: string;
	role: UserRole;
}

export interface IGoogleLoginPayload {
	idToken: string;
}

export interface IForgotPasswordPayload {
	email: string;
}
export interface IResetPasswordPayload {
	email: string;
	otp: string;
	newPassword: string;
}

// ========================================
export interface IUserRegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  designation?: string;

  profile?: {
    bio?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    dateOfBirth?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    joiningDate?: string;
    employeeId?: string;
  };
}
