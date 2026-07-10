import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().email("Enter a valid email"),
  dateOfBirth: z
    .string()
    .optional()
    .refine((val) => !val || new Date(val) < new Date(), "Must be a past date"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
