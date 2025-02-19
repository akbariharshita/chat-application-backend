// import { z } from "zod";

// export const validateSchema = (schema) => (req, res, next) => {
//   try {
//     const validatedData = schema.parse(req.body);
//     console.log({ validatedData }, "kk");
//     req.validatedData = validatedData;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return res.status(400).json({ errors: error });
//     }
//     next(error);
//   }
// };

import { body } from "express-validator";

export const validateRegister = [
  body("userName")
    .notEmpty()
    .withMessage("User name is required")
    .isLength({ min: 3 })
    .withMessage("User name must be at least 3 characters long"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email address"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export const validateLogin = [
  body("email").isEmail().withMessage("Enter a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const validateResetPassword = [
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Passwords do not match"),
];

export const validateChangePassword = [
  body("oldPassword").notEmpty().withMessage("Old password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
  body("confirmNewPassword")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("New password and confirm password do not match"),
];
