import { User } from "../modals/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generatenewResetToken,
  generateRefreshToken,
} from "../utils/token.js";
import sgMail from "@sendgrid/mail";
import { logger } from "../logger.js";
import { createMeta } from "../utils/httpResponse.js";

export const Register = async (req, res) => {
  try {
    const { password, userName, email } = req.body;

    if (!password || !userName || !email) {
      const meta = createMeta(req, res, 400, "All fields are required");
      logger.warn("Validation failed", meta);
      return res.status(400).json(meta);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const meta = createMeta(
        req,
        res,
        400,
        "User with this email already exists"
      );
      logger.warn("User already exists", { meta });
      return res.status(400).json(meta);
    }
    const hashPassword = await bcrypt.hash(password, 10);

    const createUser = new User({
      password: hashPassword,
      userName,
      email,
    });

    const saveUser = await createUser.save();
    const metaUser = {
      userId: saveUser._id,
      email: saveUser.email,
      createdAt: saveUser.createdAt,
    };

    const meta = createMeta(req, res, 201, "User created successfully", {
      user: metaUser,
    });
    logger.info("User created successfully", { meta });
    res.status(201).json(meta);
  } catch (error) {
    const meta = createMeta(
      req,
      res,
      500,
      "User not created due to server error",
      {
        error: error.message,
      }
    );
    logger.error("User creation failed", { meta });
    res.status(500).json(meta);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const meta = createMeta(req, res, 400, "Validation failed");
      logger.warn("Validation failed: All fields are required", { meta });
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (!userExists) {
      const meta = createMeta(req, res, 404, "User not found");
      logger.warn("User with this email not found", { meta });
      return res
        .status(404)
        .json({ message: "User with this email not found" });
    }

    const passwordMatch = await bcrypt.compare(password, userExists.password);
    if (!passwordMatch) {
      const meta = createMeta(req, res, 401, "Invalid password");
      logger.warn("Invalid password", { meta });
      return res.status(401).json({ message: "Invalid password" });
    }

    const newAccessToken = generateAccessToken(
      userExists.email,
      userExists._id
    );
    const newRefreshToken = generateRefreshToken(
      userExists.email,
      userExists._id
    );

    userExists.accessToken = newAccessToken;
    userExists.refreshToken = newRefreshToken;
    await userExists.save();

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    };

    const meta = createMeta(req, res, 200, "Login successful");
    logger.info("Login successful", { meta });

    res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        email: userExists.email,
        userName: userExists.userName,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
  } catch (error) {
    const meta = createMeta(req, res, 500, "Server error during login");
    logger.error("Server error during login", { meta, error: error.message });
    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const user = req.user;

    await User.findByIdAndUpdate(
      user._id,
      {
        $unset: { refreshToken: "", accessToken: "" },
      },
      { new: true }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ message: "user Logout successful" });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred during logout",
      error: error.message,
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(403).json({ message: "Refresh token not provided" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET_KEY
    );

    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user._id, user.email);

    user.accessToken = newAccessToken;

    await user.save();
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res.status(200).cookie("accessToken", newAccessToken, options).json({
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(500).json({
      message: "Refresh token not provided",
      error: error.message,
    });
  }
};

sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

const mailer = async (email, resetLink) => {
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: "Password Reset Request",
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link is valid for 1 hour.</p>
    `,
  };

  await sgMail.send(msg);
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const ExistingUser = await User.findOne({ email });

    if (!ExistingUser) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist." });
    }

    const resetToken = generatenewResetToken(ExistingUser);

    ExistingUser.resetToken = resetToken;
    await ExistingUser.save();

    const resetLink = `${req.protocol}://${req.headers.host}/reset-password/${resetToken}`;

    await mailer(email, resetLink);

    res.status(200).json({ message: "Password reset email sent." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred. Please try again later.",
      errors: error,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const { token } = req.params;

    const user = await User.findOne({ resetToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Password and confirm password must match." });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res
        .status(400)
        .json({ message: "Please use a different password." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = null;
    await user.save();

    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
};

export const resendResetLink = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email not found." });
    }

    const newResetToken = generatenewResetToken(user);
    user.resetToken = newResetToken;
    await user.save();

    const resetLink = `${req.protocol}://${req.headers.host}/reset-password/${newResetToken}`;

    await mailer(email, resetLink);
    return res.status(200).json({ message: "New password reset link sent." });
  } catch (error) {
    console.error("Error in resendResetLink:", error);
    return res.status(500).json({
      message: "An error occurred while resending the reset link.",
      error: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from the old password.",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        message: "New password and confirm password must match.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while changing the password.",
      error: error.message,
    });
  }
};
