import { z } from "zod";

export const createAssetAssignmentValidationSchema = z.object({
	body: z.object({
		assetId: z.string().uuid("Invalid asset ID"),

		employeeId: z.string().uuid("Invalid employee ID"),

		remarks: z
			.string()
			.trim()
			.max(1000, "Remarks cannot exceed 1000 characters")
			.optional(),
	}),
});

export const returnAssetAssignmentValidationSchema = z.object({
	body: z.object({
		returnCondition: z
			.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"])
			.optional(),

		remarks: z
			.string()
			.trim()
			.max(1000, "Remarks cannot exceed 1000 characters")
			.optional(),
	}),
});

export const updateAssetAssignmentValidationSchema = z.object({
	body: z.object({
		remarks: z
			.string()
			.trim()
			.max(1000, "Remarks cannot exceed 1000 characters")
			.optional(),
	}),
});
