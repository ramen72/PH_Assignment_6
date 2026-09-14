import type { AssetRequestStatus } from "../../../generated/prisma/enums";

export interface ICreateAssetRequestPayload {
	categoryId: string;
	requestedAssetId?: string;
	quantity: number;
	reason: string;
}

export interface IUpdateAssetRequestPayload {
	quantity?: number;
	reason?: string;
	categoryId?: string;
	requestedAssetId?: string;
}

export interface IRejectAssetRequestPayload {
	rejectionReason: string;
}

export interface IAssetRequestFilterRequest {
	searchTerm?: string;
	employeeId?: string;
	categoryId?: string;
	requestedAssetId?: string;
	status?: AssetRequestStatus;
}

export interface IAssetRequestReviewPayload {
	rejectionReason?: string;
}

export interface IAssetRequestOptions {
	page?: string;
	limit?: string;
	sortBy?: string;
	sortOrder?: string;
}
