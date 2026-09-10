import { prisma } from "../../lib/prisma";
import type {
  ICreateVendorPayload,
  IUpdateVendorPayload,
} from "./vendor.interface";

/**
 * Create Vendor
 */
const createVendor = async (
  payload: ICreateVendorPayload,
) => {
  const existingVendor = await prisma.vendor.findFirst({
    where: {
      OR: [
        {
          name: payload.name,
        },
        ...(payload.email
          ? [
              {
                email: payload.email,
              },
            ]
          : []),
      ],
    },
  });

  if (existingVendor) {
    throw new Error(
      "Vendor with the same name or email already exists",
    );
  }

  const vendor = await prisma.vendor.create({
    data: {
      name: payload.name,
      companyName: payload.companyName,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      website: payload.website,
      contactPerson: payload.contactPerson,
      isActive: payload.isActive,
    },
  });

  return vendor;
};

/**
 * Get All Vendors
 */
const getAllVendors = async () => {
  const vendors = await prisma.vendor.findMany({
    orderBy: {
      createdAt: "desc",
    },

    include: {
      _count: {
        select: {
          assets: true,
          purchases: true,
          maintenanceRecords: true,
        },
      },
    },
  });

  return vendors;
};

/**
 * Get Single Vendor
 */
const getSingleVendor = async (
  id: string,
) => {
  const vendor = await prisma.vendor.findUnique({
    where: {
      id,
    },

    include: {
      assets: true,
      purchases: true,
      maintenanceRecords: true,

      _count: {
        select: {
          assets: true,
          purchases: true,
          maintenanceRecords: true,
        },
      },
    },
  });

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  return vendor;
};

/**
 * Update Vendor
 */
const updateVendor = async (
  id: string,
  payload: IUpdateVendorPayload,
) => {
  const existingVendor = await prisma.vendor.findUnique({
    where: {
      id,
    },
  });

  if (!existingVendor) {
    throw new Error("Vendor not found");
  }

  if (payload.email) {
    const duplicateVendor =
      await prisma.vendor.findFirst({
        where: {
          email: payload.email,

          NOT: {
            id,
          },
        },
      });

    if (duplicateVendor) {
      throw new Error(
        "Another vendor already uses this email",
      );
    }
  }

  const vendor = await prisma.vendor.update({
    where: {
      id,
    },

    data: payload,
  });

  return vendor;
};

/**
 * Delete Vendor
 */
const deleteVendor = async (
  id: string,
) => {
  const vendor = await prisma.vendor.findUnique({
    where: {
      id,
    },

    include: {
      _count: {
        select: {
          assets: true,
          purchases: true,
          maintenanceRecords: true,
        },
      },
    },
  });

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  if (
    vendor._count.assets > 0 ||
    vendor._count.purchases > 0 ||
    vendor._count.maintenanceRecords > 0
  ) {
    throw new Error(
      "Cannot delete vendor because related records exist",
    );
  }

  await prisma.vendor.delete({
    where: {
      id,
    },
  });

  return null;
};

/**
 * Activate Vendor
 */
const activateVendor = async (
  id: string,
) => {
  const vendor = await prisma.vendor.findUnique({
    where: {
      id,
    },
  });

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  const result = await prisma.vendor.update({
    where: {
      id,
    },

    data: {
      isActive: true,
    },
  });

  return result;
};

/**
 * Deactivate Vendor
 */
const deactivateVendor = async (
  id: string,
) => {
  const vendor = await prisma.vendor.findUnique({
    where: {
      id,
    },
  });

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  const result = await prisma.vendor.update({
    where: {
      id,
    },

    data: {
      isActive: false,
    },
  });

  return result;
};

export const VendorService = {
  createVendor,
  getAllVendors,
  getSingleVendor,
  updateVendor,
  deleteVendor,
  activateVendor,
  deactivateVendor,
};