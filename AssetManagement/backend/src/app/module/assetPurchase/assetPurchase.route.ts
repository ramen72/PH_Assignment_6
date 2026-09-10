import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { AssetPurchaseController } from "./assetPurchase.controller";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post("/",auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE), AssetPurchaseController.createAssetPurchase);

router.get("/", AssetPurchaseController.getAllAssetPurchases);

router.get("/:id", AssetPurchaseController.getAssetPurchaseById);

router.patch("/:id", AssetPurchaseController.updateAssetPurchase);

router.delete("/:id", AssetPurchaseController.deleteAssetPurchase);

export const AssetPurchaseRoutes = router;
