import { prisma } from "../../lib/prisma";
import type{
  ICreateAssetCategoryPayload,
  IUpdateAssetCategoryPayload,
} from "./category.interface";

/**
 * Create Asset Category
 */
const createAssetCategory = async (
  payload: ICreateAssetCategoryPayload,
) => {
  const { name, description } = payload;

  const existingCategory = await prisma.assetCategory.findUnique({
    where: {
      name,
    },
  });

  if (existingCategory) {
    throw new Error("Asset category already exists");
  }

  const category = await prisma.assetCategory.create({
    data: {
      name,
      description,
    },
  });

  return category;
};

/**
 * Get All Asset Categories
 */
const getAllAssetCategories = async () => {
  const categories = await prisma.assetCategory.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          assets: true,
          assetRequests: true,
        },
      },
    },
  });

  return categories;
};

/**
 * Get Single Asset Category
 */
const getSingleAssetCategory = async (id: string) => {
  const category = await prisma.assetCategory.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          assets: true,
          assetRequests: true,
        },
      },
    },
  });

  if (!category) {
    throw new Error("Asset category not found");
  }

  return category;
};

/**
 * Update Asset Category
 */
const updateAssetCategory = async (
  id: string,
  payload: IUpdateAssetCategoryPayload,
) => {
  const existingCategory = await prisma.assetCategory.findUnique({
    where: {
      id,
    },
  });

  if (!existingCategory) {
    throw new Error("Asset category not found");
  }

  if (payload.name) {
    const duplicateCategory = await prisma.assetCategory.findFirst({
      where: {
        name: payload.name,
        NOT: {
          id,
        },
      },
    });

    if (duplicateCategory) {
      throw new Error("Asset category already exists");
    }
  }

  const category = await prisma.assetCategory.update({
    where: {
      id,
    },
    data: payload,
  });

  return category;
};

/**
 * Delete Asset Category
 */
const deleteAssetCategory = async (id: string) => {
  const category = await prisma.assetCategory.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          assets: true,
          assetRequests: true,
        },
      },
    },
  });

  if (!category) {
    throw new Error("Asset category not found");
  }

  if (category._count.assets > 0) {
    throw new Error(
      "Cannot delete category because assets are associated with this category",
    );
  }

  if (category._count.assetRequests > 0) {
    throw new Error(
      "Cannot delete category because asset requests are associated with this category",
    );
  }

  await prisma.assetCategory.delete({
    where: {
      id,
    },
  });

  return null;
};

export const AssetCategoryService = {
  createAssetCategory,
  getAllAssetCategories,
  getSingleAssetCategory,
  updateAssetCategory,
  deleteAssetCategory,
};