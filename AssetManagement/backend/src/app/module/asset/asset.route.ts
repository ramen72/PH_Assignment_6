import express from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AssetController } from "./asset.controller";
import {
	assetIdZodSchema,
	createAssetZodSchema,
	updateAssetZodSchema,
} from "./asset.validation";

const router = express.Router();

// Create Asset
router.post(
	"/",
	validateRequest(createAssetZodSchema),
	auth(
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
		UserRole.MANAGER,
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
	auth(
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
		UserRole.MANAGER,
	),
	validateRequest(assetIdZodSchema),
	validateRequest(updateAssetZodSchema),
	AssetController.updateAsset,
);

// Delete Asset
router.delete(
	"/:id",
	auth(
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
	),
	validateRequest(assetIdZodSchema),
	AssetController.deleteAsset,
);

export const AssetRoutes = router;
