import type { Request, Response } from "express";
import httpStatus from "http-status";


import { AssetService } from "./asset.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";


// ======================================================
// CREATE
// ======================================================

const createAsset = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await AssetService.createAsset(
        req.body,
      );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Asset created successfully",
      data: result,
    });
  },
);


// ======================================================
// GET ALL
// ======================================================

const getAllAssets = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await AssetService.getAllAssets(
        req.query,
        {
          page: req.query.page,
          limit: req.query.limit,
          sortBy: req.query.sortBy,
          sortOrder: req.query.sortOrder,
        },
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assets retrieved successfully",
      meta: {
        ...result.meta,
        totalPages: result.meta.totalPage,
      },
      data: result.data,
    });
  },
);


// ======================================================
// GET SINGLE
// ======================================================

const getSingleAsset = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await AssetService.getSingleAsset(
        req.params.id as string,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Asset retrieved successfully",
      data: result,
    });
  },
);


// ======================================================
// UPDATE
// ======================================================

const updateAsset = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await AssetService.updateAsset(
        req.params.id as string,
        req.body,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Asset updated successfully",
      data: result,
    });
  },
);


// ======================================================
// DELETE
// ======================================================

const deleteAsset = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await AssetService.deleteAsset(
        req.params.id as string,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Asset deleted successfully",
      data: result,
    });
  },
);


// ======================================================
// EXPORT
// ======================================================

export const AssetController = {
  createAsset,
  getAllAssets,
  getSingleAsset,
  updateAsset,
  deleteAsset,
};