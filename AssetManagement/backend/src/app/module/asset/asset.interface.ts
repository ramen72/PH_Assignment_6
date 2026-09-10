// import type { AssetStatus, Prisma } from "@prisma/client";

import type { Prisma } from "../../../generated/prisma/client";
import type { AssetStatus } from "../../../generated/prisma/enums";



export interface IAssetFilterRequest {
	searchTerm?: string;
	assetTag?: string;
	categoryId?: string;
	vendorId?: string;
	status?: AssetStatus;
	condition?: string;
	location?: string;
}

export interface ICreateAssetPayload {
	assetTag: string;
	name: string;
	categoryId: string;
	brand?: string;
	model?: string;
	serialNumber?: string;
	description?: string;
	purchasePrice: Prisma.Decimal | number | string;
	purchaseDate: Date | string;
	warrantyExpiry?: Date | string;
	condition?: string;
	status?: AssetStatus;
	location?: string;
	imageUrl?: string;
	vendorId?: string;
}

export interface IUpdateAssetPayload {
	assetTag?: string;
	name?: string;
	categoryId?: string;
	brand?: string;
	model?: string;
	serialNumber?: string;
	description?: string;
	purchasePrice?: Prisma.Decimal | number | string;
	purchaseDate?: Date | string;
	warrantyExpiry?: Date | string | null;
	condition?: string;
	status?: AssetStatus;
	location?: string;
	imageUrl?: string | null;
	vendorId?: string | null;
}
