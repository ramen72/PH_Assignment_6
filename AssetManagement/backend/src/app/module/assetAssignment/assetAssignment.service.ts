import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

import type {
	IAssetAssignmentFilterRequest,
	ICreateAssetAssignmentPayload,
	IPaginationOptions,
	IReturnAssetAssignmentPayload,
	IUpdateAssetAssignmentPayload,
} from "./assetAssignment.interface";

const assignmentInclude = {
	asset: {
		select: {
			id: true,
			assetTag: true,
			name: true,
			brand: true,
			model: true,
			serialNumber: true,
			condition: true,
			status: true,
			location: true,
		},
	},

	employee: {
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			department: true,
			designation: true,
		},
	},

	assignedBy: {
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
		},
	},
} satisfies Prisma.AssetAssignmentInclude;

type AssignmentWithRelations = Prisma.AssetAssignmentGetPayload<{
	include: typeof assignmentInclude;
}>;

// CREATE ASSIGNMENT
const createAssetAssignmentService = async (
	payload: ICreateAssetAssignmentPayload,
	assignedById: string,
): Promise<AssignmentWithRelations> => {
	const { assetId, employeeId, remarks } = payload;

	return await prisma.$transaction(
		async (tx) => {
			// 1. Find asset
			const asset = await tx.asset.findUnique({
				where: {
					id: assetId,
				},
			});

			if (!asset) {
				throw new AppError(404, "Asset not found");
			}

			// 2. Check asset status
			if (asset.status !== "AVAILABLE") {
				throw new AppError(
					400,
					`Asset is not available. Current status: ${asset.status}`,
				);
			}

			// 3. Find employee
			const employee = await tx.user.findUnique({
				where: {
					id: employeeId,
				},
			});

			if (!employee) {
				throw new AppError(404, "Employee not found");
			}

			// 4. Check employee status
			if (
				employee.status !== "ACTIVE" ||
				!employee.isActive ||
				employee.isDeleted
			) {
				throw new AppError(400, "Employee is not active");
			}

			// 5. Check duplicate active assignment
			const existingAssignment = await tx.assetAssignment.findFirst({
				where: {
					assetId,
					returnedAt: null,
				},
			});

			if (existingAssignment) {
				throw new AppError(
					400,
					"This asset is already assigned to an employee",
				);
			}

			// 6. Create assignment
			const assignment = await tx.assetAssignment.create({
				data: {
					assetId,
					employeeId,
					assignedById,
					remarks,
				},

				include: assignmentInclude,
			});

			// 7. Update asset status
			await tx.asset.update({
				where: {
					id: assetId,
				},

				data: {
					status: "ASSIGNED",
				},
			});

			return assignment;
		},
		{
			isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
		},
	);
};

// GET ALL ASSIGNMENTS
const getAllAssetAssignmentsService = async (
	filters: IAssetAssignmentFilterRequest,
	options: IPaginationOptions,
) => {
	const { searchTerm, assetId, employeeId, assignedById, returned } = filters;

	const {
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = options;

	const pageNumber = Number(page);
	const limitNumber = Number(limit);

	const skip = (pageNumber - 1) * limitNumber;

	const andConditions: Prisma.AssetAssignmentWhereInput[] = [];

	// Asset filter
	if (assetId) {
		andConditions.push({
			assetId,
		});
	}

	// Employee filter
	if (employeeId) {
		andConditions.push({
			employeeId,
		});
	}

	// Assigned by filter
	if (assignedById) {
		andConditions.push({
			assignedById,
		});
	}

	// Active / returned filter
	if (returned === true) {
		andConditions.push({
			returnedAt: {
				not: null,
			},
		});
	}

	if (returned === false) {
		andConditions.push({
			returnedAt: null,
		});
	}

	// Search by asset / employee
	if (searchTerm) {
		andConditions.push({
			OR: [
				{
					asset: {
						assetTag: {
							contains: searchTerm,
							mode: "insensitive",
						},
					},
				},

				{
					asset: {
						name: {
							contains: searchTerm,
							mode: "insensitive",
						},
					},
				},

				{
					employee: {
						name: {
							contains: searchTerm,
							mode: "insensitive",
						},
					},
				},

				{
					employee: {
						email: {
							contains: searchTerm,
							mode: "insensitive",
						},
					},
				},
			],
		});
	}

	const whereConditions: Prisma.AssetAssignmentWhereInput =
		andConditions.length > 0
			? {
					AND: andConditions,
				}
			: {};

	const validSortFields = ["createdAt", "assignedAt", "returnedAt"];

	const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";

	const safeSortOrder = sortOrder === "asc" ? "asc" : "desc";

	const [data, total] = await prisma.$transaction([
		prisma.assetAssignment.findMany({
			where: whereConditions,

			skip,

			take: limitNumber,

			orderBy: {
				[safeSortBy]: safeSortOrder,
			},

			include: assignmentInclude,
		}),

		prisma.assetAssignment.count({
			where: whereConditions,
		}),
	]);

	return {
		meta: {
			page: pageNumber,
			limit: limitNumber,
			total,
			totalPages: Math.ceil(total / limitNumber),
		},

		data,
	};
};

// GET SINGLE ASSIGNMENT
const getSingleAssetAssignmentService = async (
	id: string,
): Promise<AssignmentWithRelations> => {
	const assignment = await prisma.assetAssignment.findUnique({
		where: {
			id,
		},

		include: assignmentInclude,
	});

	if (!assignment) {
		throw new AppError(404, "Asset assignment not found");
	}

	return assignment;
};

// RETURN ASSET
const returnAssetAssignmentService = async (
	id: string,
	payload: IReturnAssetAssignmentPayload,
): Promise<AssignmentWithRelations> => {
	const { returnCondition, remarks } = payload;

	return await prisma.$transaction(
		async (tx) => {
			// 1. Find assignment
			const assignment = await tx.assetAssignment.findUnique({
				where: {
					id,
				},
			});

			if (!assignment) {
				throw new AppError(404, "Asset assignment not found");
			}

			// 2. Already returned?
			if (assignment.returnedAt) {
				throw new AppError(400, "This asset has already been returned");
			}

			// 3. Update assignment
			const updatedAssignment = await tx.assetAssignment.update({
				where: {
					id,
				},

				data: {
					returnedAt: new Date(),

					returnCondition,

					remarks: remarks !== undefined ? remarks : assignment.remarks,
				},

				include: assignmentInclude,
			});

			// 4. Update asset status
			await tx.asset.update({
				where: {
					id: assignment.assetId,
				},

				data: {
					status: "AVAILABLE",

					condition: returnCondition ?? undefined,
				},
			});

			return updatedAssignment;
		},
		{
			isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
		},
	);
};

// UPDATE ASSIGNMENT
const updateAssetAssignmentService = async (
	id: string,
	payload: IUpdateAssetAssignmentPayload,
): Promise<AssignmentWithRelations> => {
	const existingAssignment = await prisma.assetAssignment.findUnique({
		where: {
			id,
		},
	});

	if (!existingAssignment) {
		throw new AppError(404, "Asset assignment not found");
	}

	if (existingAssignment.returnedAt) {
		throw new AppError(400, "Cannot update a returned assignment");
	}

	const updatedAssignment = await prisma.assetAssignment.update({
		where: {
			id,
		},

		data: {
			remarks: payload.remarks,
		},

		include: assignmentInclude,
	});

	return updatedAssignment;
};

// DELETE ASSIGNMENT
const deleteAssetAssignmentService = async (
	id: string,
): Promise<AssignmentWithRelations> => {
	return await prisma.$transaction(async (tx) => {
		const assignment = await tx.assetAssignment.findUnique({
			where: {
				id,
			},
		});

		if (!assignment) {
			throw new AppError(404, "Asset assignment not found");
		}

		if (!assignment.returnedAt) {
			throw new AppError(400, "Return the asset before deleting assignment");
		}

		const deletedAssignment = await tx.assetAssignment.delete({
			where: {
				id,
			},

			include: assignmentInclude,
		});

		return deletedAssignment;
	});
};

export const AssetAssignmentService = {
	createAssetAssignmentService,
	getAllAssetAssignmentsService,
	getSingleAssetAssignmentService,
	returnAssetAssignmentService,
	updateAssetAssignmentService,
	deleteAssetAssignmentService,
};
