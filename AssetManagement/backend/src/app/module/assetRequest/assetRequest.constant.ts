// import { AssetRequestStatus } from "../../generated/prisma/client";

import { AssetRequestStatus } from "../../../generated/prisma/enums";

export const assetRequestSearchableFields = ["reason"];

export const assetRequestFilterableFields = [
	"employeeId",
	"categoryId",
	"requestedAssetId",
	"status",
	"quantity",
];

export const assetRequestStatus = AssetRequestStatus;
