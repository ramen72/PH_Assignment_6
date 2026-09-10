export interface ICreateAssetCategoryPayload {
	name: string;
	description?: string;
}

export interface IUpdateAssetCategoryPayload {
	name?: string;
	description?: string;
}
