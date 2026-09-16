import { z } from "zod";

export const createAssetAssignmentValidationZodSchema = z.object({
	body: z.object({
		assetId: z.uuid("Invalid asset purchase ID"),

		employeeId: z.string().uuid("Invalid employee ID"),

		remarks: z
			.string()
			.trim()
			.max(1000, "Remarks cannot exceed 1000 characters")
			.optional(),
	}),
});

export const returnAssetAssignmentValidationZodSchema = z.object({
	body: z.object({
		returnCondition: z
			.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"])
			.optional(),

		remarks: z
			.string()
			.trim()
			.max(500, "Remarks cannot exceed 500 characters")
			.optional(),
	}),
});

export const updateAssetAssignmentValidationZodSchema = z.object({
	body: z.object({
		remarks: z
			.string()
			.trim()
			.max(1000, "Remarks cannot exceed 1000 characters")
			.optional(),
	}),
});

export const assetAssignmentValidationIdZodSchema = z.object({
	params: z.object({
		id: z.uuid("Invalid asset purchase ID"),
	}),
});
