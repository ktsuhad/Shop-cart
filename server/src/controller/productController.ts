import { Request, Response } from "express";
import productModel from "../Model/productModel";
import { Cloud } from "../config/Cloudinary";
import path from "path";
import fs from "fs";

//create product
export const productController = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      price,
      discountPercentage,
      rating,
      brand,
      category,
    } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res
        .status(400)
        .json({ success: false, message: "Image is required" });
    }

    const imageStream = await Cloud.uploader.upload(imageFile.path, {
      folder: "product-folder",
      transformation: [{ width: 200, height: 200, crop: "fill" }],
    });

    //validation
    if (
      !title ||
      !description ||
      !price ||
      !discountPercentage ||
      !rating ||
      !brand ||
      !category
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are mandatory" });
    }

    // Validation: Check if a product with the same title already exists
    const existingProduct = await productModel.findOne({ title });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product with the same title already exists",
      });
    }

    const product = new productModel({
      title,
      description,
      price,
      discountPercentage,
      rating,
      brand,
      category,
      image: imageStream.secure_url,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error while creating product", error });
  }
};

// // ---------------------------------------------------------------------------------------------

// // Delete product
export const deleteProductController = async (req: Request, res: Response) => {
  try {
    const deleteProduct = await productModel.findByIdAndDelete(
      req.params.productId
    );

    if (!deleteProduct) {
      throw new Error("cannot delete product");
    }

    // Delete the corresponding image from Cloudinary (assuming you're using Cloudinary)
    if (deleteProduct.image) {
      const publicId = deleteProduct.image.substring(
        deleteProduct.image.lastIndexOf("/") + 1,
        deleteProduct.image.lastIndexOf(".")
      );
      await Cloud.uploader.destroy(publicId);
    }

    // Delete the local image file
    if (deleteProduct.image) {
      const imagePath = path.join(
        __dirname,
        "../../public/uploads",
        deleteProduct.image
      );
      fs.unlinkSync(imagePath);
    }

    res.status(200).send({
      success: true,
      message: "product deleted",
      deleteProduct,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "error while deleting product", error });
  }
};

// // ---------------------------------------------------------------------------------------------

//update product
export const UpdateproductController = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId;
    const {
      title,
      description,
      price,
      discountPercentage,
      rating,
      brand,
      category,
    } = req.body;
    const imageFile = req.file;

    // Find the existing product
    const existingProduct = await productModel.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    // Update the fields
    existingProduct.title = title;
    existingProduct.description = description;
    existingProduct.price = price;
    existingProduct.discountPercentage = discountPercentage;
    existingProduct.rating = rating;
    existingProduct.brand = brand;
    existingProduct.category = category;
    if (imageFile) {
      // Delete the old image from Cloudinary
      if (existingProduct.image) {
        const publicId = existingProduct.image.substring(
          existingProduct.image.lastIndexOf("/") + 1,
          existingProduct.image.lastIndexOf(".")
        );
        await Cloud.uploader.destroy(publicId);
      }

      // Upload new image to Cloudinary
      const imageStream = await Cloud.uploader.upload(imageFile.path, {
        folder: "product-folder",
        transformation: [{ width: 200, height: 200, crop: "fill" }],
      });
      existingProduct.image = imageStream.secure_url;
    }

    await existingProduct.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: existingProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while updating product",
      error,
    });
  }
};

// ---------------------------------------------------------------------------------------------
// getAll product

export const getAllproductController = async (req: Request, res: Response) => {
  try {
    const products = await productModel
      .find({})
      .limit(12)
      .sort({ createdAt: -1 });

    if (!products) {
      return res.status(404).send({
        success: false,
        message: "no products",
      });
    }
    res.status(200).send({
      success: true,
      message: "All products",
      totalProducts: products.length,
      products,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "error while in getting all products",
    });
  }
};
