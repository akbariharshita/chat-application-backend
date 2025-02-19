import express from "express";
import {
  changePassword,
  forgotPassword,
  login,
  logoutUser,
  refreshAccessToken,
  Register,
  resendResetLink,
  resetPassword,
} from "../controllers/auth-controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  validateChangePassword,
  validateLogin,
  validateRegister,
  validateResetPassword,
} from "../middleware/validateMiddleware.js";
import { validationResult } from "express-validator";

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post("/register", validateRegister, validate, Register);
router.post("/login", validateLogin, validate, login);
router.post("/logout", authMiddleware, logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", validateResetPassword, validate, resetPassword);
router.post(
  "/change-password",
  validateChangePassword,
  validate,
  authMiddleware,
  changePassword
);
router.post("/resend-link", resendResetLink);

export default router;
