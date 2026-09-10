import { Router } from "express";
import {
	CreateVendorZodSchema,
	UpdateVendorZodSchema,
} from "./vendor.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { VendorController } from "./vendor.controller";

const router = Router();

/**
 * Create Vendor
 */
router.post(
	"/",
	validateRequest(CreateVendorZodSchema),
	VendorController.createVendor,
);

/**
 * Get All Vendors
 */
router.get("/", VendorController.getAllVendors);

/**
 * Get Single Vendor
 */
router.get("/:id", VendorController.getSingleVendor);

/**
 * Update Vendor
 */
router.patch(
	"/:id",
	validateRequest(UpdateVendorZodSchema),
	VendorController.updateVendor,
);

/**
 * Delete Vendor
 */
router.delete("/:id", VendorController.deleteVendor);

/**
 * Activate Vendor
 */
router.patch("/:id/activate", VendorController.activateVendor);

/**
 * Deactivate Vendor
 */
router.patch("/:id/deactivate", VendorController.deactivateVendor);

export const VendorRoutes = router;
