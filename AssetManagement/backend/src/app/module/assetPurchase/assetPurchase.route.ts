import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AssetPurchaseController } from "./assetPurchase.controller";
import {
	assetPurchaseIdZodSchema,
	CreateAssetPurchaseZodSchema,
	UpdateAssetPurchaseZodSchema,
} from "./assetPurchase.validation";

const router = Router();

router.post(
	"/",
	auth(
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
		UserRole.MANAGER,
		UserRole.EMPLOYEE,
	),
	validateRequest(CreateAssetPurchaseZodSchema),
	AssetPurchaseController.createAssetPurchase,
);

router.get("/", AssetPurchaseController.getAllAssetPurchases);

router.get(
	"/:id",
	validateRequest(assetPurchaseIdZodSchema),
	AssetPurchaseController.getAssetPurchaseById,
);

router.patch(
	"/:id",
	validateRequest(assetPurchaseIdZodSchema),
	validateRequest(UpdateAssetPurchaseZodSchema),
	AssetPurchaseController.updateAssetPurchase,
);

router.delete(
	"/:id",
	validateRequest(assetPurchaseIdZodSchema),
	AssetPurchaseController.deleteAssetPurchase,
);

export const AssetPurchaseRoutes = router;
