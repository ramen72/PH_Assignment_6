import { z } from "zod";

export const CreateVendorZodSchema = z.object({
  name: z
    .string()
    .min(2, "Vendor name must be at least 2 characters")
    .max(150, "Vendor name cannot exceed 150 characters"),

  companyName: z
    .string()
    .max(150, "Company name cannot exceed 150 characters")
    .optional(),

  email: z
    .email("Need a valid email")
    .optional(),

  phone: z
    .string()
    .max(30, "Phone number cannot exceed 30 characters")
    .optional(),

  address: z
    .string()
    .max(500, "Address cannot exceed 500 characters")
    .optional(),

  website: z
    .url("Need a valid website URL")
    .optional(),

  contactPerson: z
    .string()
    .max(150, "Contact person cannot exceed 150 characters")
    .optional(),

  isActive: z
    .boolean()
    .optional(),
});

export const UpdateVendorZodSchema = z.object({
  name: z
    .string()
    .min(2, "Vendor name must be at least 2 characters")
    .max(150, "Vendor name cannot exceed 150 characters")
    .optional(),

  companyName: z
    .string()
    .max(150, "Company name cannot exceed 150 characters")
    .optional(),

  email: z
    .email("Need a valid email")
    .optional(),

  phone: z
    .string()
    .max(30, "Phone number cannot exceed 30 characters")
    .optional(),

  address: z
    .string()
    .max(500, "Address cannot exceed 500 characters")
    .optional(),

  website: z
    .url("Need a valid website URL")
    .optional(),

  contactPerson: z
    .string()
    .max(150, "Contact person cannot exceed 150 characters")
    .optional(),

  isActive: z
    .boolean()
    .optional(),
});