import httpStatus from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import { AssetRequestStatus } from './../../../generated/prisma/enums';
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { paginationHelper } from "../../utils/paginationHelper";
import type { IPaginationOptions } from "../asset/asset.interface";
import type {
	IAssetRequestFilterRequest,
	IAssetRequestOptions,
	ICreateAssetRequestPayload,
	IUpdateAssetRequestPayload,
} from "./assetRequest.interface";


// Create Asset Request
const createAssetRequestService = async (
	userId: string,
	payload: ICreateAssetRequestPayload,
) => {
	const { categoryId, requestedAssetId, quantity, reason } = payload;

	// Check category
	const category = await prisma.assetCategory.findUnique({
		where: {
			id: categoryId,
		},
	});

	if (!category) {
		throw new AppError(httpStatus.NOT_FOUND, "Asset category not found");
	}

	// Check requested asset if provided
	if (requestedAssetId) {
		const asset = await prisma.asset.findUnique({
			where: {
				id: requestedAssetId,
			},
		});

		if (!asset) {
			throw new AppError(httpStatus.NOT_FOUND, "Requested asset not found");
		}

		// Ensure asset belongs to selected category
		if (asset.categoryId !== categoryId) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Requested asset does not belong to this category",
			);
		}
	}

	const result = await prisma.assetRequest.create({
		data: {
			employeeId: userId,
			categoryId,
			requestedAssetId,
			quantity,
			reason,
		},
		include: {
			employee: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			category: true,
			requestedAsset: true,
		},
	});

	return result;
};

// Get All Asset Requests
const getAllAssetRequestsService = async (
	filters: IAssetRequestFilterRequest,
	// options: IAssetRequestOptions,
	options: IPaginationOptions,
) => {
	const { searchTerm, employeeId, categoryId, requestedAssetId, status } =
		filters;

	const { page, limit, skip, sortBy, sortOrder } =
		paginationHelper.calculatePagination(options as IPaginationOptions);

	const andConditions: Prisma.AssetRequestWhereInput[] = [];

	// Search by reason
	if (searchTerm) {
		andConditions.push({
			OR: [
				{
					reason: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
				{
					rejectionReason: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
			],
		});
	}

	// Filters
	if (employeeId) {
		andConditions.push({
			employeeId,
		});
	}

	if (categoryId) {
		andConditions.push({
			categoryId,
		});
	}

	if (requestedAssetId) {
		andConditions.push({
			requestedAssetId,
		});
	}

	if (status) {
		andConditions.push({
			status,
		});
	}

	const whereConditions: Prisma.AssetRequestWhereInput =
		andConditions.length > 0
			? {
					AND: andConditions,
				}
			: {};

	const result = await prisma.assetRequest.findMany({
		where: whereConditions,

		skip,

		take: limit,

		orderBy: {
			[sortBy]: sortOrder,
		},

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

			category: true,

			requestedAsset: true,

			reviewedBy: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	const total = await prisma.assetRequest.count({
		where: whereConditions,
	});

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: result,
	};
};

// Get My Asset Requests
const getMyAssetRequestsService = async (
	userId: string,
	filters: IAssetRequestFilterRequest,
	options: IAssetRequestOptions,
) => {
	const { searchTerm, categoryId, status } = filters;

	const { page, limit, skip, sortBy, sortOrder } =
		paginationHelper.calculatePagination(options);

	const andConditions: Prisma.AssetRequestWhereInput[] = [
		{
			employeeId: userId,
		},
	];

	if (searchTerm) {
		andConditions.push({
			reason: {
				contains: searchTerm,
				mode: "insensitive",
			},
		});
	}

	if (categoryId) {
		andConditions.push({
			categoryId,
		});
	}

	if (status) {
		andConditions.push({
			status,
		});
	}

	const whereConditions: Prisma.AssetRequestWhereInput = {
		AND: andConditions,
	};

	const result = await prisma.assetRequest.findMany({
		where: whereConditions,

		skip,

		take: limit,

		orderBy: {
			[sortBy]: sortOrder,
		},

		include: {
			category: true,
			requestedAsset: true,

			reviewedBy: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	const total = await prisma.assetRequest.count({
		where: whereConditions,
	});

	return {
		meta: {
			page,
			limit,
			total,
		},
		data: result,
	};
};

// Get Single Asset Request
const getSingleAssetRequestService = async (id: string, userId: string) => {
	const result = await prisma.assetRequest.findUnique({
		where: {
			id,
		},

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

			category: true,

			requestedAsset: true,

			reviewedBy: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	if (!result) {
		throw new AppError(httpStatus.NOT_FOUND, "Asset request not found");
	}

	// Employee can only view own request.
	if (result.employeeId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not authorized to view this request",
		);
	}

	return result;
};

// Update Asset Request
const updateAssetRequestService = async (
	id: string,
	userId: string,
	payload: IUpdateAssetRequestPayload,
) => {
	const existingRequest = await prisma.assetRequest.findUnique({
		where: {
			id,
		},
	});

	if (!existingRequest) {
		throw new AppError(httpStatus.NOT_FOUND, "Asset request not found");
	}

	if (existingRequest.employeeId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not authorized to update this request",
		);
	}

	if (existingRequest.status !== AssetRequestStatus.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only pending requests can be updated",
		);
	}

	if (payload.categoryId) {
		const category = await prisma.assetCategory.findUnique({
			where: {
				id: payload.categoryId,
			},
		});

		if (!category) {
			throw new AppError(httpStatus.NOT_FOUND, "Asset category not found");
		}
	}

	if (payload.requestedAssetId) {
		const asset = await prisma.asset.findUnique({
			where: {
				id: payload.requestedAssetId,
			},
		});

		if (!asset) {
			throw new AppError(httpStatus.NOT_FOUND, "Requested asset not found");
		}

		const finalCategoryId = payload.categoryId ?? existingRequest.categoryId;

		if (asset.categoryId !== finalCategoryId) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Requested asset does not belong to this category",
			);
		}
	}

	const result = await prisma.assetRequest.update({
		where: {
			id,
		},
		data: payload,
		include: {
			category: true,
			requestedAsset: true,
		},
	});

	return result;
};

// Cancel Asset Request
const cancelAssetRequestService = async (id: string, userId: string) => {
	const existingRequest = await prisma.assetRequest.findUnique({
		where: {
			id,
		},
	});

	if (!existingRequest) {
		throw new AppError(httpStatus.NOT_FOUND, "Asset request not found");
	}

	if (existingRequest.employeeId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not authorized to cancel this request",
		);
	}

	if (existingRequest.status !== AssetRequestStatus.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only pending requests can be cancelled",
		);
	}

	const result = await prisma.assetRequest.update({
		where: {
			id,
		},

		data: {
			status: AssetRequestStatus.CANCELLED,
		},
	});

	return result;
};

// Approve Asset Request
const approveAssetRequestService = async (id: string, reviewerId: string) => {
	const existingRequest = await prisma.assetRequest.findUnique({
		where: {
			id,
		},
	});

	if (!existingRequest) {
		throw new AppError(httpStatus.NOT_FOUND, "Asset request not found");
	}

	if (existingRequest.status !== AssetRequestStatus.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only pending requests can be approved",
		);
	}

	const result = await prisma.assetRequest.update({
		where: {
			id,
		},

		data: {
			status: AssetRequestStatus.APPROVED,
			reviewedById: reviewerId,
			reviewedAt: new Date(),
			rejectionReason: null,
		},

		include: {
			employee: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			category: true,
			requestedAsset: true,
			reviewedBy: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	return result;
};

// Reject Asset Request
const rejectAssetRequestService = async (
	id: string,
	reviewerId: string,
	rejectionReason: string,
) => {
	const existingRequest = await prisma.assetRequest.findUnique({
		where: {
			id,
		},
	});

	if (!existingRequest) {
		throw new AppError(httpStatus.NOT_FOUND, "Asset request not found");
	}

	if (existingRequest.status !== AssetRequestStatus.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only pending requests can be rejected",
		);
	}

	const result = await prisma.assetRequest.update({
		where: {
			id,
		},

		data: {
			status: AssetRequestStatus.REJECTED,
			reviewedById: reviewerId,
			reviewedAt: new Date(),
			rejectionReason,
		},

		include: {
			employee: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			category: true,
			requestedAsset: true,
			reviewedBy: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	return result;
};

// Delete Asset Request
const deleteAssetRequestService = async (id: string) => {
	const existingRequest = await prisma.assetRequest.findUnique({
		where: {
			id,
		},
	});

	if (!existingRequest) {
		throw new AppError(httpStatus.NOT_FOUND, "Asset request not found");
	}

	await prisma.assetRequest.delete({
		where: {
			id,
		},
	});

	return null;
};

export const AssetRequestService = {
	createAssetRequestService,
	getAllAssetRequestsService,
	getMyAssetRequestsService,
	getSingleAssetRequestService,
	updateAssetRequestService,
	cancelAssetRequestService,
	approveAssetRequestService,
	rejectAssetRequestService,
	deleteAssetRequestService,
};
