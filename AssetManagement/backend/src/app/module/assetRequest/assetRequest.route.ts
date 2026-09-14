import { Router } from "express";

import { AssetRequestController } from "./assetRequest.controller";

import { auth } from "../../middleware/auth";

import { validateRequest } from "../../middleware/validateRequest";

import {
	createAssetRequestSchema,
	updateAssetRequestSchema,
	rejectAssetRequestSchema,
} from "./assetRequest.validation";

import { UserRole } from "../../generated/prisma/client";

const router = Router();

// Create Asset Request
router.post(
	"/",
	auth(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.MANAGER),
	// validateRequest(createAssetRequestSchema),
	AssetRequestController.createAssetRequest,
);

// Get My Requests
router.get(
	"/myRequests",
	auth(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.MANAGER),
	AssetRequestController.getMyAssetRequests,
);

// Update Request
router.patch(
	"/:id",
	auth(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.MANAGER),
	//   validateRequest(updateAssetRequestSchema),
	AssetRequestController.updateAssetRequest,
);

// Cancel Request
router.patch(
	"/:id/cancel",
	auth(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.MANAGER),
	AssetRequestController.cancelAssetRequest,
);

// Approve Request
router.patch(
	"/:id/approve",
	auth(UserRole.ADMIN, UserRole.MANAGER),
	AssetRequestController.approveAssetRequest,
);

// Reject Request
router.patch(
	"/:id/reject",
	auth(UserRole.ADMIN, UserRole.MANAGER),
	//   validateRequest(rejectAssetRequestSchema),
	AssetRequestController.rejectAssetRequest,
);

// Delete Request
router.delete(
	"/:id",
	auth(UserRole.ADMIN),
	AssetRequestController.deleteAssetRequest,
);

export const AssetRequestRoutes = router;
