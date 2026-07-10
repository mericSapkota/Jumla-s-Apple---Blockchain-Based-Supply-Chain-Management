import { z } from "zod";

export const createBlogSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(150),
  coverImageUrl: z.string().trim().url("Enter a valid image URL").optional().or(z.literal("")),
  excerpt: z
    .string()
    .trim()
    .max(220, "Keep the excerpt under 220 characters")
    .optional()
    .or(z.literal("")),
  content: z.string().trim().min(50, "Write at least a short paragraph (50+ characters)"),
});
