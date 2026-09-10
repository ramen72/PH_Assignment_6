import { z } from "zod";

export const createAssetZodSchema = z.object({
	body: z.object({
		assetTag: z
			.string()
			.min(1, "Asset tag is required")
			.max(100, "Asset tag is too long"),

		name: z
			.string()
			.min(1, "Asset name is required")
			.max(200, "Asset name is too long"),

		categoryId: z.uuid("Invalid category ID"),

		brand: z.string().max(100).optional(),

		model: z.string().max(100).optional(),

		serialNumber: z.string().max(150).optional(),

		description: z.string().optional(),

		purchasePrice: z.coerce
			.number()
			.nonnegative("Purchase price cannot be negative"),

		purchaseDate: z.coerce.date(),

		warrantyExpiry: z.coerce.date().optional(),

		condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]).optional(),

		status: z
			.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED", "LOST"])
			.optional(),

		location: z.string().max(200).optional(),

		imageUrl: z.url().optional(),

		vendorId: z.uuid("Invalid vendor ID").optional(),
	}),
});

export const updateAssetZodSchema = z.object({
	body: z.object({
		assetTag: z.string().min(1).max(100).optional(),

		name: z.string().min(1).max(200).optional(),

		categoryId: z.uuid().optional(),

		brand: z.string().max(100).optional(),

		model: z.string().max(100).optional(),

		serialNumber: z.string().max(150).optional(),

		description: z.string().optional(),

		purchasePrice: z.coerce.number().nonnegative().optional(),

		purchaseDate: z.coerce.date().optional(),

		warrantyExpiry: z.coerce.date().nullable().optional(),

		condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]).optional(),

		status: z
			.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED", "LOST"])
			.optional(),

		location: z.string().max(200).optional(),

		imageUrl: z.url().nullable().optional(),

		vendorId: z.uuid().nullable().optional(),
	}),
});

export const assetIdZodSchema = z.object({
	params: z.object({
		id: z.uuid("Invalid asset ID"),
	}),
});
