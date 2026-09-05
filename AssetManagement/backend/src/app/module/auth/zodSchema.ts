import z from "zod";

export const RegisterZodSchema = z.object({
	name: z
		.string("Not a string.!")
		.min(3, { message: "Name must be at least 3 characters long.!" })
		.max(50, { message: "Name length must be between 3-50 characters.!" }),
	email: z.email("Need a valid email.!"),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long." })
		.max(48, { message: "Password cannot exceed 48 characters." })
		.regex(/[A-Z]/, {
			message: "Password must contain at least one UPPERCASE letter.",
		})
		.regex(/[a-z]/, {
			message: "Password must contain at least one lowercase letter.",
		})
		.regex(/[0-9]/, { message: "Password must contain at least one number." })
		.regex(/[^A-Za-z0-9]/, {
			message: "Password must contain at least one special character.",
		}),
	patient: z
		.object({
			contactNumber: z.string().optional(),
		})
		.optional(),
});

export const PatientEmailVerifyZodSchema = z.object({
	email: z.email("Need a valid email.!"),
	otp: z.string().length(6),
});

export const LoginZodSchema = z.object({
	email: z.email("Need a valid email.!"),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long." })
		.max(48, { message: "Password cannot exceed 48 characters." })
		.regex(/[A-Z]/, {
			message: "Password must contain at least one UPPERCASE letter.",
		})
		.regex(/[a-z]/, {
			message: "Password must contain at least one lowercase letter.",
		})
		.regex(/[0-9]/, { message: "Password must contain at least one number." })
		.regex(/[^A-Za-z0-9]/, {
			message: "Password must contain at least one special character.",
		}),
	patient: z
		.object({
			contactNumber: z.string().optional(),
		})
		.optional(),
});

export const ForgotPasswordZodSchema = z.object({
	email: z.email("Need a valid email.!"),
});

export const ResetPasswordZodSchema = z.object({
	email: z.email("Need a valid email.!"),
	newPassword: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long." })
		.max(48, { message: "Password cannot exceed 48 characters." })
		.regex(/[A-Z]/, {
			message: "Password must contain at least one UPPERCASE letter.",
		})
		.regex(/[a-z]/, {
			message: "Password must contain at least one lowercase letter.",
		})
		.regex(/[0-9]/, { message: "Password must contain at least one number." })
		.regex(/[^A-Za-z0-9]/, {
			message: "Password must contain at least one special character.",
		}),
	otp: z.string().length(6),
});
