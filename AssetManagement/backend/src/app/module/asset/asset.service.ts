import { type Asset, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	IAssetFilterRequest,
	ICreateAssetPayload,
	IUpdateAssetPayload,
} from "./asset.interface";

// ======================================================
// CREATE ASSET
// ======================================================

const createAsset = async (payload: ICreateAssetPayload): Promise<Asset> => {
	const existingAsset = await prisma.asset.findFirst({
		where: {
			OR: [
				{
					assetTag: payload.assetTag,
				},
				...(payload.serialNumber
					? [{ serialNumber: payload.serialNumber }]
					: []),
			],
		},
	});

	if (existingAsset) {
		throw new AppError(
			409,
			"Asset with this asset tag or serial number already exists",
		);
	}

	// Check category
	const category = await prisma.assetCategory.findUnique({
		where: {
			id: payload.categoryId,
		},
	});

	if (!category) {
		throw new AppError(404, "Asset category not found");
	}

	// Check vendor if provided
	if (payload.vendorId) {
		const vendor = await prisma.vendor.findUnique({
			where: {
				id: payload.vendorId,
			},
		});

		if (!vendor) {
			throw new AppError(404, "Vendor not found");
		}
	}

	const result = await prisma.asset.create({
		data: {
			assetTag: payload.assetTag,
			name: payload.name,
			categoryId: payload.categoryId,
			brand: payload.brand,
			model: payload.model,
			serialNumber: payload.serialNumber,
			description: payload.description,

			purchasePrice: new Prisma.Decimal(payload.purchasePrice),

			purchaseDate: new Date(payload.purchaseDate),

			warrantyExpiry: payload.warrantyExpiry
				? new Date(payload.warrantyExpiry)
				: undefined,

			condition: payload.condition,
			status: payload.status,

			location: payload.location,
			imageUrl: payload.imageUrl,
			vendorId: payload.vendorId,
		},

		include: {
			category: true,
			vendor: true,
		},
	});

	return result;
};

/*
// GET ALL ASSETS
const getAllAssets = async (
	filters: IAssetFilterRequest,
	options: IPaginationOptions,
) => {
	const {
		searchTerm,
		assetTag,
		categoryId,
		vendorId,
		status,
		condition,
		location,
	} = filters;

	const { page, limit, skip, sortBy, sortOrder } =
		paginationHelper.calculatePagination(options);

	const andConditions: Prisma.AssetWhereInput[] = [];

	// Search
	if (searchTerm) {
		andConditions.push({
			OR: [
				{
					name: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
				{
					assetTag: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
				{
					brand: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
				{
					model: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
				{
					serialNumber: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
				{
					location: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
			],
		});
	}

	if (assetTag) {
		andConditions.push({
			assetTag: {
				contains: assetTag,
				mode: "insensitive",
			},
		});
	}

	if (categoryId) {
		andConditions.push({
			categoryId,
		});
	}

	if (vendorId) {
		andConditions.push({
			vendorId,
		});
	}

	if (status) {
		andConditions.push({
			status,
		});
	}

	if (condition) {
		andConditions.push({
			condition,
		});
	}

	if (location) {
		andConditions.push({
			location: {
				contains: location,
				mode: "insensitive",
			},
		});
	}

	const whereConditions: Prisma.AssetWhereInput =
		andConditions.length > 0
			? {
					AND: andConditions,
				}
			: {};

	const result = await prisma.asset.findMany({
		where: whereConditions,

		skip,
		take: limit,

		orderBy: {
			[sortBy || "createdAt"]: sortOrder || "desc",
		},

		include: {
			category: true,
			vendor: true,
		},
	});

	const total = await prisma.asset.count({
		where: whereConditions,
	});

	return {
		meta: {
			page,
			limit,
			total,
			totalPage: Math.ceil(total / limit),
		},
		data: result,
	};
};

// GET SINGLE ASSET
const getSingleAsset = async (id: string): Promise<Asset> => {
	const result = await prisma.asset.findUnique({
		where: {
			id,
		},

		include: {
			category: true,
			vendor: true,

			assignments: {
				include: {
					employee: {
						select: {
							id: true,
							name: true,
							email: true,
							department: true,
							designation: true,
						},
					},

					assignedBy: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},

				orderBy: {
					assignedAt: "desc",
				},
			},

			assetRequests: {
				orderBy: {
					createdAt: "desc",
				},
			},

			assetPurchases: {
				orderBy: {
					purchaseDate: "desc",
				},
			},

			maintenanceRecords: {
				orderBy: {
					createdAt: "desc",
				},
			},
		},
	});

	if (!result) {
		throw new AppError(404, "Asset not found");
	}

	return result;
};

// UPDATE ASSET
const updateAsset = async (
	id: string,
	payload: IUpdateAssetPayload,
): Promise<Asset> => {
	const existingAsset = await prisma.asset.findUnique({
		where: {
			id,
		},
	});

	if (!existingAsset) {
		throw new AppError(404, "Asset not found");
	}

	// Check duplicate asset tag
	if (payload.assetTag) {
		const duplicateAsset = await prisma.asset.findFirst({
			where: {
				assetTag: payload.assetTag,
				NOT: {
					id,
				},
			},
		});

		if (duplicateAsset) {
			throw new AppError(409, "Asset tag already exists");
		}
	}

	// Check duplicate serial number
	if (payload.serialNumber) {
		const duplicateSerial = await prisma.asset.findFirst({
			where: {
				serialNumber: payload.serialNumber,
				NOT: {
					id,
				},
			},
		});

		if (duplicateSerial) {
			throw new AppError(409, "Serial number already exists");
		}
	}

	// Check category
	if (payload.categoryId) {
		const category = await prisma.assetCategory.findUnique({
			where: {
				id: payload.categoryId,
			},
		});

		if (!category) {
			throw new AppError(404, "Asset category not found");
		}
	}

	// Check vendor
	if (payload.vendorId) {
		const vendor = await prisma.vendor.findUnique({
			where: {
				id: payload.vendorId,
			},
		});

		if (!vendor) {
			throw new AppError(404, "Vendor not found");
		}
	}

	const data: Prisma.AssetUpdateInput = {};

	if (payload.assetTag !== undefined) data.assetTag = payload.assetTag;

	if (payload.name !== undefined) data.name = payload.name;

	if (payload.categoryId !== undefined)
		data.category = {
			connect: {
				id: payload.categoryId,
			},
		};

	if (payload.brand !== undefined) data.brand = payload.brand;

	if (payload.model !== undefined) data.model = payload.model;

	if (payload.serialNumber !== undefined)
		data.serialNumber = payload.serialNumber;

	if (payload.description !== undefined) data.description = payload.description;

	if (payload.purchasePrice !== undefined) {
		data.purchasePrice = new Prisma.Decimal(payload.purchasePrice);
	}

	if (payload.purchaseDate !== undefined) {
		data.purchaseDate = new Date(payload.purchaseDate);
	}

	if (payload.warrantyExpiry !== undefined) {
		data.warrantyExpiry =
			payload.warrantyExpiry === null ? null : new Date(payload.warrantyExpiry);
	}

	if (payload.condition !== undefined) data.condition = payload.condition;

	if (payload.status !== undefined) data.status = payload.status;

	if (payload.location !== undefined) data.location = payload.location;

	if (payload.imageUrl !== undefined) data.imageUrl = payload.imageUrl;

	if (payload.vendorId !== undefined) {
		data.vendor =
			payload.vendorId === null
				? {
						disconnect: true,
					}
				: {
						connect: {
							id: payload.vendorId,
						},
					};
	}

	const result = await prisma.asset.update({
		where: {
			id,
		},

		data,

		include: {
			category: true,
			vendor: true,
		},
	});

	return result;
};

// DELETE ASSET
const deleteAsset = async (id: string): Promise<Asset> => {
	const existingAsset = await prisma.asset.findUnique({
		where: {
			id,
		},

		include: {
			assignments: {
				where: {
					returnedAt: null,
				},
			},
		},
	});

	if (!existingAsset) {
		throw new AppError(404, "Asset not found");
	}

	// Don't delete assigned asset
	if (existingAsset.assignments.length > 0) {
		throw new AppError(
			400,
			"Cannot delete an assigned asset. Return the asset first.",
		);
	}

	const result = await prisma.asset.delete({
		where: {
			id,
		},
	});

	return result;
};
*/
// EXPORT
export const AssetService = {
	createAsset,
	/*
	getAllAssets,
	getSingleAsset,
	updateAsset,
	deleteAsset,
	*/
};
