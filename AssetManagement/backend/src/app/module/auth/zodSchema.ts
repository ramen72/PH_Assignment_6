import z from "zod";

export const UserRegisterZodSchema = z.object({
	name: z
		.string("Name must be a string.")
		.min(3, { message: "Name must be at least 3 characters long." })
		.max(50, { message: "Name length must be between 3-50 characters." }),
	email: z.email("Need a valid email."),
	password: z
		.string("Password must be a string.")
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
	phone: z
		.string("Phone number must be a string.")
		.regex(/^01[3-9]\d{8}$/, {
			message: "Please provide a valid Bangladesh phone number.",
		})
		.optional(),
	department: z
		.string("Department must be a string.")
		.min(2, { message: "Department must be at least 2 characters long." })
		.max(100, { message: "Department cannot exceed 100 characters." })
		.optional(),
	designation: z
		.string("Designation must be a string.")
		.min(2, { message: "Designation must be at least 2 characters long." })
		.max(100, { message: "Designation cannot exceed 100 characters." })
		.optional(),
	profile: z
		.object({
			bio: z
				.string("Bio must be a string.")
				.max(500, { message: "Bio cannot exceed 500 characters." })
				.optional(),
			address: z
				.string("Address must be a string.")
				.max(255, { message: "Address cannot exceed 255 characters." })
				.optional(),
			city: z
				.string("City must be a string.")
				.max(100, { message: "City cannot exceed 100 characters." })
				.optional(),
			postalCode: z
				.string("Postal code must be a string.")
				.max(20, { message: "Postal code cannot exceed 20 characters." })
				.optional(),
			country: z
				.string("Country must be a string.")
				.max(100, { message: "Country cannot exceed 100 characters." })
				.optional(),
			dateOfBirth: z
				.string("Date of birth must be a valid date string.")
				.refine((value) => !isNaN(Date.parse(value)), {
					message: "Date of birth must be a valid date.",
				})
				.optional(),
			emergencyContactName: z
				.string("Emergency contact name must be a string.")
				.max(100, {
					message: "Emergency contact name cannot exceed 100 characters.",
				})
				.optional(),
			emergencyContactPhone: z
				.string("Emergency contact phone must be a string.")
				.regex(/^01[3-9]\d{8}$/, {
					message:
						"Please provide a valid Bangladesh emergency contact phone number.",
				})
				.optional(),
			joiningDate: z
				.string("Joining date must be a valid date string.")
				.refine((value) => !isNaN(Date.parse(value)), {
					message: "Joining date must be a valid date.",
				})
				.optional(),
			employeeId: z
				.string("Employee ID must be a string.")
				.max(50, { message: "Employee ID cannot exceed 50 characters." })
				.optional(),
		})
		.optional(),
});

export const UserEmailVerifyZodSchema = z.object({
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
	email: z.string().trim().email("Need a valid email.!"),
});

export const ResetPasswordZodSchema = z.object({
	email: z.email("Need a valid email.!"),
	newPassword: z
		.string("Password must be a string.")
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
