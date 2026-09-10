import { Router } from "express";

import { AssetCategoryController } from "./category.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
	CreateAssetCategoryZodSchema,
	UpdateAssetCategoryZodSchema,
} from "./category.validation";

const router = Router();

router.post(
	"/",
	validateRequest(CreateAssetCategoryZodSchema),
	AssetCategoryController.createAssetCategory,
);

router.get("/", AssetCategoryController.getAllAssetCategories);

router.get("/:id", AssetCategoryController.getSingleAssetCategory);

router.patch(
	"/:id",
	validateRequest(UpdateAssetCategoryZodSchema),
	AssetCategoryController.updateAssetCategory,
);

router.delete("/:id", AssetCategoryController.deleteAssetCategory);

export const AssetCategoryRoutes = router;
