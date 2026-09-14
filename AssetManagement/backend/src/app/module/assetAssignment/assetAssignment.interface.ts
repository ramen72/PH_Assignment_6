import type { AssetCondition } from "../../../generated/prisma/enums";

export interface ICreateAssetAssignmentPayload {
	assetId: string;
	employeeId: string;
	remarks?: string;
}

export interface IReturnAssetAssignmentPayload {
	returnCondition?: AssetCondition;
	remarks?: string;
}

export interface IUpdateAssetAssignmentPayload {
	remarks?: string;
}

export interface IAssetAssignmentFilterRequest {
	searchTerm?: string;
	assetId?: string;
	employeeId?: string;
	assignedById?: string;
	returned?: boolean;
}

export interface IPaginationOptions {
	page?: string | number;
	limit?: string | number;
	sortBy?: string;
	sortOrder?: string;
}
