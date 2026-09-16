import { z } from "zod";
import { PaymentStatus } from "../../../generated/prisma/enums";

export const CreateAssetPurchaseZodSchema = z.object({
	body: z.object({
		assetId: z.uuid("Invalid asset ID"),

		vendorId: z.uuid("Invalid vendor ID"),

		invoiceNumber: z
			.string()
			.trim()
			.min(1, "Invoice number is required")
			.max(100, "Invoice number is too long"),

		quantity: z.coerce
			.number()
			.int("Quantity must be an integer")
			.positive("Quantity must be greater than 0"),

		unitPrice: z.coerce.number().positive("Unit price must be greater than 0"),

		purchaseDate: z.coerce
			.date({
				error: "Invalid purchase date",
			})
			.optional(),
		paymentStatus: z
			.enum([
				PaymentStatus.FAILED,
				PaymentStatus.PAID,
				PaymentStatus.PARTIAL,
				PaymentStatus.PENDING,
				PaymentStatus.REFUNDED,
			])
			.optional(),

		invoiceUrl: z.url("Invalid invoice URL").nullable().optional(),

		remarks: z
			.string()
			.max(500, "Remarks cannot exceed 500 characters")
			.nullable()
			.optional(),
	}),
});

export const UpdateAssetPurchaseZodSchema = z.object({
	body: z.object({
		vendorId: z.uuid("Invalid vendor ID").optional(),

		invoiceNumber: z
			.string()
			.trim()
			.min(1, "Invoice number is required")
			.max(100, "Invoice number is too long")
			.optional(),

		quantity: z.coerce
			.number()
			.int("Quantity must be a whole number")
			.positive("Quantity must be greater than 0")
			.optional(),

		unitPrice: z.coerce
			.number()
			.finite("Unit price must be a valid number")
			.nonnegative("Unit price cannot be negative")
			.optional(),

		purchaseDate: z.coerce
			.date({
				error: "Invalid purchase date",
			})
			.optional(),

		paymentStatus: z
			.enum([
				PaymentStatus.FAILED,
				PaymentStatus.PAID,
				PaymentStatus.PARTIAL,
				PaymentStatus.PENDING,
				PaymentStatus.REFUNDED,
			])
			.optional(),

		invoiceUrl: z.url("Invalid invoice URL").nullable().optional(),

		remarks: z.string().max(1000, "Remarks is too long").nullable().optional(),
	}),
});

export const assetPurchaseIdZodSchema = z.object({
	params: z.object({
		id: z.uuid("Invalid asset purchase ID"),
	}),
});
