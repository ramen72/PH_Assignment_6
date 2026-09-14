import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid UUID");

export const createAssetRequestSchema = z.object({
	body: z.object({
		categoryId: uuidSchema,

		requestedAssetId: uuidSchema.optional(),

		quantity: z
			.number()
			.int("Quantity must be an integer")
			.min(1, "Quantity must be at least 1"),

		reason: z
			.string()
			.trim()
			.min(5, "Reason must be at least 5 characters")
			.max(1000, "Reason cannot exceed 1000 characters"),
	}),
});

export const updateAssetRequestSchema = z.object({
	body: z.object({
		categoryId: uuidSchema.optional(),

		requestedAssetId: uuidSchema.optional(),

		quantity: z
			.number()
			.int("Quantity must be an integer")
			.min(1, "Quantity must be at least 1")
			.optional(),

		reason: z
			.string()
			.trim()
			.min(5, "Reason must be at least 5 characters")
			.max(1000, "Reason cannot exceed 1000 characters")
			.optional(),
	}),
});

export const rejectAssetRequestSchema = z.object({
	body: z.object({
		rejectionReason: z
			.string()
			.trim()
			.min(5, "Rejection reason must be at least 5 characters")
			.max(1000, "Rejection reason cannot exceed 1000 characters"),
	}),
});
