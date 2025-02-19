import jwt from "jsonwebtoken";
import { User } from "../modals/userModel.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "Unauthorized request" });
    }

    const jwtVerify = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(jwtVerify?.userId).select(
      "-password -refreshToken"
    );

    if (!user) {
      res.status(401).json({ message: "Invalid Access Token" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Access Token" });
  }
};
