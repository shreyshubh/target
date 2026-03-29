const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters").max(30).trim().toLowerCase(),
    email: z.string().email("Invalid email format").trim().toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[\W_]/, "Password must contain at least one special character")
  }).strict()
});

const loginSchema = z.object({
  body: z.object({
    username: z.string().trim().toLowerCase(),
    password: z.string()
  }).strict()
});

const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(30).trim().toLowerCase().optional(),
    email: z.string().email("Invalid email").trim().toLowerCase().optional()
  }).strict()
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8)
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[\W_]/, "Password must contain at least one special character")
  }).strict()
});

const deleteAccountSchema = z.object({
  body: z.object({
    password: z.string().min(1, "Password is required to delete account")
  }).strict()
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema
};
