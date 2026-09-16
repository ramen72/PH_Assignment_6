import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AssetRequestController } from "./assetRequest.controller";
import {
	assetRequestSchemaIdZodSchema,
	createAssetRequestSchema,
	rejectAssetRequestSchema,
	updateAssetRequestSchema,
} from "./assetRequest.validation";

const router = Router();

// Create Asset Request
router.post(
	"/",
	auth(
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
		UserRole.MANAGER,
		UserRole.EMPLOYEE,
	),
	validateRequest(createAssetRequestSchema),
	AssetRequestController.createAssetRequest,
);

// Get All Asset Request
router.get(
	"/",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
	validateRequest(createAssetRequestSchema),
	AssetRequestController.getAllAssetRequests,
);

// Get Single Asset Requests
router.get(
	"/requests/:id",
	auth(
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
		UserRole.MANAGER,
		UserRole.EMPLOYEE,
	),
	validateRequest(assetRequestSchemaIdZodSchema),
	AssetRequestController.getMyAssetRequests,
);
// Get My Requests
router.get(
	"/myRequests",
	auth(
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
		UserRole.MANAGER,
		UserRole.EMPLOYEE,
	),
	AssetRequestController.getMyAssetRequests,
);

// Update Request
router.patch(
	"/:id",
	auth(
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
		UserRole.MANAGER,
		UserRole.EMPLOYEE,
	),
	validateRequest(assetRequestSchemaIdZodSchema),
	validateRequest(updateAssetRequestSchema),
	AssetRequestController.updateAssetRequest,
);

// Cancel Request
router.patch(
	"/cancel/:id",
	auth(
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
		UserRole.MANAGER,
		UserRole.EMPLOYEE,
	),
	validateRequest(assetRequestSchemaIdZodSchema),
	AssetRequestController.cancelAssetRequest,
);

// Approve Request
router.patch(
	"/approve/:id",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
	validateRequest(assetRequestSchemaIdZodSchema),
	AssetRequestController.approveAssetRequest,
);

// Reject Request
router.patch(
	"/reject/:id",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
	validateRequest(assetRequestSchemaIdZodSchema),
	validateRequest(rejectAssetRequestSchema),
	AssetRequestController.rejectAssetRequest,
);

// Delete Request
router.delete(
	"/:id",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
	validateRequest(assetRequestSchemaIdZodSchema),
	AssetRequestController.deleteAssetRequest,
);

export const AssetRequestRoutes = router;
