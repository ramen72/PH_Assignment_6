import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import type {
	ICreateAssetPurchasePayload,
	IUpdateAssetPurchasePayload,
} from "./assetPurchase.interface";

const createAssetPurchase = async (
	userId: string,
	payload: ICreateAssetPurchasePayload,
) => {
	const {
		assetId,
		vendorId,
		invoiceNumber,
		quantity,
		unitPrice,
		purchaseDate,
		paymentStatus,
		invoiceUrl,
		remarks,
	} = payload;

	// Check Asset
	const asset = await prisma.asset.findUnique({
		where: {
			id: assetId,
		},
	});

	if (!asset) {
		throw new Error("Asset not found");
	}

	// Check Vendor
	const vendor = await prisma.vendor.findUnique({
		where: {
			id: vendorId,
		},
	});

	if (!vendor) {
		throw new Error("Vendor not found");
	}

	if (!vendor.isActive) {
		throw new Error("Vendor is inactive");
	}

	// Check Invoice Number
	const existingInvoice = await prisma.assetPurchase.findUnique({
		where: {
			invoiceNumber,
		},
	});

	if (existingInvoice) {
		throw new Error("Invoice number already exists");
	}

	const totalAmount = quantity * unitPrice;

	const result = await prisma.$transaction(async (tx) => {
		const purchase = await tx.assetPurchase.create({
			data: {
				assetId,
				vendorId,
				createdById: userId,
				invoiceNumber,
				quantity,
				unitPrice: new Prisma.Decimal(unitPrice),
				totalAmount: new Prisma.Decimal(totalAmount),
				purchaseDate: purchaseDate ?? new Date(),
				paymentStatus: paymentStatus ?? "PENDING",
				invoiceUrl,
				remarks,
			},

			include: {
				asset: {
					select: {
						id: true,
						assetTag: true,
						name: true,
					},
				},

				vendor: {
					select: {
						id: true,
						name: true,
						companyName: true,
					},
				},

				createdBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		// 2. Update asset information
		await tx.asset.update({
			where: {
				id: assetId,
			},
			data: {
				vendorId,
				purchasePrice: new Prisma.Decimal(unitPrice),
				purchaseDate: purchaseDate ?? new Date(),
				status: "AVAILABLE",
			},
		});

		return purchase;
	});

	return result;
};

const getAllAssetPurchases = async () => {
	const result = await prisma.assetPurchase.findMany({
		orderBy: {
			createdAt: "desc",
		},

		include: {
			asset: {
				select: {
					id: true,
					assetTag: true,
					name: true,
					brand: true,
					model: true,
				},
			},

			vendor: {
				select: {
					id: true,
					name: true,
					companyName: true,
					phone: true,
					email: true,
				},
			},

			createdBy: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},

			payments: true,
		},
	});

	return result;
};

const getAssetPurchaseById = async (id: string) => {
	const result = await prisma.assetPurchase.findUnique({
		where: {
			id,
		},

		include: {
			asset: {
				include: {
					category: true,
				},
			},

			vendor: true,

			createdBy: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},

			payments: true,
		},
	});

	if (!result) {
		throw new Error("Asset purchase not found");
	}

	return result;
};

const updateAssetPurchase = async (
	id: string,
	payload: IUpdateAssetPurchasePayload,
) => {
	const existingPurchase = await prisma.assetPurchase.findUnique({
		where: {
			id,
		},
	});

	if (!existingPurchase) {
		throw new Error("Asset purchase not found");
	}

	if (payload.vendorId) {
		const vendor = await prisma.vendor.findUnique({
			where: {
				id: payload.vendorId,
			},
		});

		if (!vendor) {
			throw new Error("Vendor not found");
		}

		if (!vendor.isActive) {
			throw new Error("Vendor is inactive");
		}
	}

	if (payload.invoiceNumber) {
		const invoice = await prisma.assetPurchase.findFirst({
			where: {
				invoiceNumber: payload.invoiceNumber,
				NOT: {
					id,
				},
			},
		});

		if (invoice) {
			throw new Error("Invoice number already exists");
		}
	}

	const quantity = payload.quantity ?? existingPurchase.quantity;

	const unitPrice = payload.unitPrice ?? Number(existingPurchase.unitPrice);

	const totalAmount = quantity * unitPrice;

	const result = await prisma.assetPurchase.update({
		where: {
			id,
		},

		data: {
			...(payload.vendorId && {
				vendorId: payload.vendorId,
			}),

			...(payload.invoiceNumber && {
				invoiceNumber: payload.invoiceNumber,
			}),

			...(payload.quantity !== undefined && {
				quantity: payload.quantity,
			}),

			...(payload.unitPrice !== undefined && {
				unitPrice: new Prisma.Decimal(payload.unitPrice),
			}),

			...(payload.purchaseDate && {
				purchaseDate: payload.purchaseDate,
			}),

			...(payload.paymentStatus && {
				paymentStatus: payload.paymentStatus,
			}),

			...(payload.invoiceUrl !== undefined && {
				invoiceUrl: payload.invoiceUrl,
			}),

			...(payload.remarks !== undefined && {
				remarks: payload.remarks,
			}),

			totalAmount: new Prisma.Decimal(totalAmount),
		},

		include: {
			asset: true,
			vendor: true,
		},
	});

	return result;
};

const deleteAssetPurchase = async (id: string) => {
	const purchase = await prisma.assetPurchase.findUnique({
		where: {
			id,
		},

		include: {
			payments: true,
		},
	});

	if (!purchase) {
		throw new Error("Asset purchase not found");
	}

	if (purchase.payments.length > 0) {
		throw new Error("Purchase cannot be deleted because payment records exist");
	}

	await prisma.assetPurchase.delete({
		where: {
			id,
		},
	});

	return null;
};

export const AssetPurchaseService = {
	createAssetPurchase,
	getAllAssetPurchases,
	getAssetPurchaseById,
	updateAssetPurchase,
	deleteAssetPurchase,
};
