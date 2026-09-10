import type { PaymentStatus } from "../../../generated/prisma/enums";

export interface ICreateAssetPurchasePayload {
	assetId: string;
	vendorId: string;
	invoiceNumber: string;
	quantity: number;
	unitPrice: number;
	purchaseDate?: Date;
	paymentStatus?: PaymentStatus;
	invoiceUrl?: string;
	remarks?: string;
}

export interface IUpdateAssetPurchasePayload {
	vendorId?: string;
	invoiceNumber?: string;
	quantity?: number;
	unitPrice?: number;
	purchaseDate?: Date;
	paymentStatus?: PaymentStatus;
	invoiceUrl?: string;
	remarks?: string;
}
