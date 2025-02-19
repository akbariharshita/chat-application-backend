import express from "express";
import userRoute from "./authRoute.js";
import productRoute from "./productRoute.js";

const router = express.Router();

router.use("/user", userRoute);
router.use("/product", productRoute);

export default router;
