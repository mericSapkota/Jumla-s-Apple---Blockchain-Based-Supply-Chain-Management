import { z } from "zod";

export const APPLE_VARIETIES = ["Fuji", "Delicious", "Gala", "Mixed"];

export const createBatchSchema = z.object({
  farmLocation: z.string().trim().min(2, "Enter the farm location"),
  appleVariety: z.string().min(1, "Select a variety"),
  weightKg: z
    .number({ invalid_type_error: "Enter a weight in kg" })
    .positive("Weight must be greater than 0"),
  harvestDate: z.string().min(1, "Select a harvest date"),
  ipfsHash: z.string().optional().default(""),
  aiResult: z.string().optional().default("PENDING"),
  photoPath: z.string().optional().default(""),
});

export const transitUpdateSchema = z.object({
  location: z.string().trim().min(2, "Enter the current location"),
  destination: z.string().trim().min(2, "Enter the destination"),
});

export const ipfsUpdateSchema = z.object({
  ipfsHash: z.string().trim().min(1, "Enter the IPFS hash"),
  aiResult: z.string().trim().min(1, "Enter the AI result"),
});

export const batchIdSchema = z.object({
  batchId: z.string().trim().min(3, "Enter a valid batch ID"),
});
