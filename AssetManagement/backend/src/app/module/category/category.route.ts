import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AssetCategoryController } from "./category.controller";
import {
	AssetCategoryZodSchema,
	CreateAssetCategoryZodSchema,
	UpdateAssetCategoryZodSchema,
} from "./category.validation";

const router = Router();

router.post(
	"/",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
	validateRequest(CreateAssetCategoryZodSchema),
	AssetCategoryController.createAssetCategory,
);

router.get("/", AssetCategoryController.getAllAssetCategories);

router.get(
	"/:id",
	validateRequest(AssetCategoryZodSchema),
	AssetCategoryController.getSingleAssetCategory,
);

router.patch(
	"/:id",
	validateRequest(UpdateAssetCategoryZodSchema),
	AssetCategoryController.updateAssetCategory,
);

router.delete("/:id", AssetCategoryController.deleteAssetCategory);

export const AssetCategoryRoutes = router;
