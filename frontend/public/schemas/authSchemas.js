import { z } from "zod";

export const ROLES = ["FARMER", "COOPERATIVE", "TRANSPORTER", "CONSUMER"];

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(ROLES, { required_error: "Select a role" }),
  dateOfBirth: z
    .string({ required_error: "Date of birth is required" })
    .min(1, "Date of birth is required")
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d < new Date();
    }, "Date of birth must be a valid past date"),
  // profilePicture is a FileList from the <input type="file">; it is NOT part
  // of the JSON payload — we extract it separately before sending.
  profilePicture: z
    .any()
    .optional()
    .refine((files) => {
      if (!files || files.length === 0) return true; // optional
      const file = files[0];
      return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    }, "Only JPG, PNG, or WEBP images are allowed")
    .refine((files) => {
      if (!files || files.length === 0) return true;
      return files[0].size <= 5 * 1024 * 1024;
    }, "Profile picture must be 5 MB or smaller"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
