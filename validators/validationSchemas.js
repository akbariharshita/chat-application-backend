import { z } from "zod";

export const registrationSchema = z.object({
  userName: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(225, "Name cannot exceed 225 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(7, "Password must be at least 7 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(
      /[@$!%*?&]/,
      "Password must contain at least one special character."
    ),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address."),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number.")
      .regex(
        /[@$!%*?&]/,
        "Password must contain at least one special character."
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(8, "Current password must be at least 8 characters long."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long.")
      .refine((val) => /[A-Z]/.test(val), {
        message: "New password must contain at least one uppercase letter.",
      })
      .refine((val) => /[a-z]/.test(val), {
        message: "New password must contain at least one lowercase letter.",
      })
      .refine((val) => /\d/.test(val), {
        message: "New password must contain at least one number.",
      })
      .refine((val) => /[!@#$%^&*]/.test(val), {
        message:
          "New password must contain at least one special character (!@#$%^&*).",
      }),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
