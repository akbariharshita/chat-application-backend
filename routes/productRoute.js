import express from "express";
import {
  createProduct,
  deleteProduct,
  getCategorywise,
  getProducts,
  updateProduct,
} from "../controllers/products-controller.js";
import { upload } from "../middleware/multer-uploadMiddleware.js";
const router = express.Router();

router.post("/create", upload.single("image"), createProduct);
router.get("/", getProducts);
router.put("/update/:id", upload.single("image"), updateProduct);
router.delete("/delete/:id", deleteProduct);
router.get("/category", getCategorywise);

export default router;
