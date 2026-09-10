import { z } from "zod";

export const CreateAssetCategoryZodSchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

export const UpdateAssetCategoryZodSchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters")
    .optional(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});