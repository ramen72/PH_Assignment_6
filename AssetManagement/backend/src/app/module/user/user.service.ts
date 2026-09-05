import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";

const uploadProfileImageService = async (buffer: Buffer, userId: string) => {
	// 1. Get existing image public ID
	const existingUser = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			imagePublicId: true,
		},
	});

	const oldImagePublicId = existingUser?.imagePublicId;

	// 2. Upload new image first
	const result = await new Promise<UploadApiResponse>((resolve, reject) => {
		cloudinary.uploader
			.upload_stream(
				{
					resource_type: "auto",
					folder: `RB-HealthCare/profile-images/${userId}`,
				},
				(error, result) => {
					if (error) {
						return reject(error);
					}

					if (!result) {
						return reject(new Error("No result returned from Cloudinary.!"));
					}

					resolve(result);
				},
			)
			.end(buffer);
	});

	// 3. Update database with new image
	const updateUser = await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			imageUrl: result.secure_url,
			imagePublicId: result.public_id,
		},
	});

	// 4. Delete old image only after successful new upload + DB update
	if (oldImagePublicId) {
		await cloudinary.uploader.destroy(oldImagePublicId);
	}

	return updateUser;
};

export const UserServices = {
	uploadProfileImageService,
};
