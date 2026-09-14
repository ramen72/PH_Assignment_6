import express from "express";

import { validateRequest } from "../../middleware/validateRequest";
import { AssetController } from "./asset.controller";
import {
	assetIdZodSchema,
	createAssetZodSchema,
	updateAssetZodSchema,
} from "./asset.validation";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";

const router = express.Router();

// Create Asset
router.post(
	"/",
	// validateRequest(createAssetZodSchema),
	auth(
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
		UserRole.MANAGER,
		UserRole.EMPLOYEE,
	),
	AssetController.createAsset,
);

// Get All Assets
router.get("/", AssetController.getAllAssets);

// Get Single Asset
router.get(
	"/:id",
	validateRequest(assetIdZodSchema),
	AssetController.getSingleAsset,
);

// Update Asset
router.patch(
	"/:id",
	validateRequest(assetIdZodSchema),
	validateRequest(updateAssetZodSchema),
	AssetController.updateAsset,
);

// Delete Asset
router.delete(
	"/:id",
	validateRequest(assetIdZodSchema),
	AssetController.deleteAsset,
);

export const AssetRoutes = router;
