import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AssetRequestController } from "./assetRequest.controller";



const router = Router();

// Create Asset Request
router.post(
	"/",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE),
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
