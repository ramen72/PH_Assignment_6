import type { Request, Response } from "express";
import { AssetPurchaseService } from "./assetPurchase.service";

const createAssetPurchase = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId;
		const payload = req.body;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
			});
		}

		const result = await AssetPurchaseService.createAssetPurchase(
			userId,
			payload,
		);

		return res.status(201).json({
			success: true,
			message: "Asset purchase created successfully",
			data: result,
		});
	} catch (error: any) {
		return res.status(400).json({
			success: false,
			message: error.message || "Failed to create asset purchase",
		});
	}
};

const getAllAssetPurchases = async (req: Request, res: Response) => {
	try {
		const result = await AssetPurchaseService.getAllAssetPurchases();

		return res.status(200).json({
			success: true,
			message: "Asset purchases retrieved successfully",
			data: result,
		});
	} catch (error: any) {
		return res.status(500).json({
			success: false,
			message: error.message || "Failed to retrieve asset purchases",
		});
	}
};

const getAssetPurchaseById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const result = await AssetPurchaseService.getAssetPurchaseById(
			id as string,
		);

		return res.status(200).json({
			success: true,
			message: "Asset purchase retrieved successfully",
			data: result,
		});
	} catch (error: any) {
		return res.status(404).json({
			success: false,
			message: error.message || "Asset purchase not found",
		});
	}
};

const updateAssetPurchase = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const result = await AssetPurchaseService.updateAssetPurchase(
			id as string,
			req.body,
		);

		return res.status(200).json({
			success: true,
			message: "Asset purchase updated successfully",
			data: result,
		});
	} catch (error: any) {
		return res.status(400).json({
			success: false,
			message: error.message || "Failed to update asset purchase",
		});
	}
};

const deleteAssetPurchase = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		await AssetPurchaseService.deleteAssetPurchase(id as string);

		return res.status(200).json({
			success: true,
			message: "Asset purchase deleted successfully",
			data: null,
		});
	} catch (error: any) {
		return res.status(400).json({
			success: false,
			message: error.message || "Failed to delete asset purchase",
		});
	}
};

export const AssetPurchaseController = {
	createAssetPurchase,
	getAllAssetPurchases,
	getAssetPurchaseById,
	updateAssetPurchase,
	deleteAssetPurchase,
};
