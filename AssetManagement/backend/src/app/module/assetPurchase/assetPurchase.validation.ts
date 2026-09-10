import { z } from "zod";

export const CreateAssetPurchaseZodSchema = z.object({
	assetId: z.uuid("Invalid asset ID"),

	vendorId: z.uuid("Invalid vendor ID"),

	invoiceNumber: z
		.string()
		.min(1, "Invoice number is required")
		.max(100, "Invoice number is too long"),

	quantity: z
		.number()
		.int("Quantity must be an integer")
		.positive("Quantity must be greater than 0"),

	unitPrice: z.number().positive("Unit price must be greater than 0"),

	purchaseDate: z.coerce.date().optional(),

	paymentStatus: z.enum(["PENDING", "PAID", "PARTIAL", "CANCELLED"]).optional(),

	invoiceUrl: z.url("Invalid invoice URL").optional(),

	remarks: z
		.string()
		.max(500, "Remarks cannot exceed 500 characters")
		.optional(),
});

export const UpdateAssetPurchaseZodSchema = z.object({
	vendorId: z.uuid("Invalid vendor ID").optional(),

	invoiceNumber: z.string().min(1).max(100).optional(),

	quantity: z.number().int().positive().optional(),

	unitPrice: z.number().positive().optional(),

	purchaseDate: z.coerce.date().optional(),

	paymentStatus: z.enum(["PENDING", "PAID", "PARTIAL", "CANCELLED"]).optional(),

	invoiceUrl: z.url().optional(),

	remarks: z.string().max(500).optional(),
});
