import { Product } from "../modals/productModel.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    if (!req.file || !name || !description || !price || !category) {
      return res.status(400).json({ message: "all fields are required" });
    }

    const imagePath = req.file.path;
    console.log({ imagePath });
    const cloudinaryResponse = await uploadOnCloudinary(imagePath);

    if (!cloudinaryResponse) {
      return res
        .status(500)
        .json({ message: "Failed to upload image on Cloudinary" });
    }

    fs.unlinkSync(imagePath);

    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      image: cloudinaryResponse.secure_url,
    });

    const savedProduct = await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while creating the product",
      error: error.message,
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    res
      .status(201)
      .json({ message: "Product get successfully", products: products });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while get the product",
      error: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    let updatedFields = { ...updateData };

    if (req.file) {
      const imagePath = req.file.path;

      const cloudinaryResponse = await uploadOnCloudinary(imagePath);

      if (!cloudinaryResponse) {
        return res
          .status(500)
          .json({ message: "Failed to upload image on Cloudinary" });
      }

      updatedFields.image = cloudinaryResponse.secure_url;

      fs.unlinkSync(imagePath);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error while updating the product:", error);
    res.status(500).json({
      message: "An error occurred while updating the product",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteProduct = await Product.findByIdAndDelete({
      _id: id,
    });

    res.status(200).json({
      message: "Product deleted successfully",
      deleteProduct,
    });
  } catch (error) {
    console.error("Error while deleting the product:", error);
    res.status(500).json({
      message: "An error occurred while deleting the product",
      error: error.message,
    });
  }
};

export const getCategorywise = async (req, res) => {
  try {
    const result = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          totalProducts: { $sum: 1 },
          averagePrice: { $avg: "$price" },
          revenuePrice: { $sum: { $multiply: ["$price", "$stock"] } },
        },
      },
      { $sort: { averagePrice: -1, stock: 1 } },
      { $limit: 2 },
    ]);

    res.status(200).json({
      message: "Product category get successfully",
      result,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while getCategorywise the product",
      error: error.message,
    });
  }
};
