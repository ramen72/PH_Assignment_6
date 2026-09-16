import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AssetAssignmentController } from "./assetAssignment.controller";
import {
	assetAssignmentValidationIdZodSchema,
	createAssetAssignmentValidationZodSchema,
	returnAssetAssignmentValidationZodSchema,
	updateAssetAssignmentValidationZodSchema,
} from "./assetAssignment.validation";

const router = Router();

// CREATE ASSIGNMENT
router.post(
	"/",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
	validateRequest(createAssetAssignmentValidationZodSchema),
	AssetAssignmentController.createAssetAssignment,
);

// GET ALL ASSIGNMENTS
router.get(
	"/",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
	AssetAssignmentController.getAllAssetAssignments,
);

// GET SINGLE ASSIGNMENT
router.get(
	"/:id",
	validateRequest(assetAssignmentValidationIdZodSchema),
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
	AssetAssignmentController.getSingleAssetAssignment,
);

// RETURN ASSET
router.patch(
	"/return/:id",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
	validateRequest(assetAssignmentValidationIdZodSchema),
	validateRequest(returnAssetAssignmentValidationZodSchema),
	AssetAssignmentController.returnAssetAssignment,
);

// UPDATE ASSIGNMENT
router.patch(
	"/update/:id",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
	validateRequest(assetAssignmentValidationIdZodSchema),
	validateRequest(updateAssetAssignmentValidationZodSchema),
	AssetAssignmentController.updateAssetAssignment,
);

// DELETE ASSIGNMENT
router.delete(
	"/delete/:id",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
	AssetAssignmentController.deleteAssetAssignment,
);

export const AssetAssignmentRoutes = router;
