import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/ProductModel.js";

//add product controller
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
    } = req.body;

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.imag41 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );

    let imagesUrl = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    const productData = {
      name,
      description,
      category,
      price: Number(price),
      subCategory,
      bestseller: bestseller === "true" ? true : false,
      sizes: JSON.parse(sizes),
      image: imagesUrl,
      date: Date.now(),
    };

    const product = new productModel(productData);

    // console.log(product);

    await product.save();

    res.json({ success: true, msg: "product added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, msg: "error adding product" });
  }
};

//list product controller
const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({});
    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.json({ success: false, msg: "error listing product" });
  }
};

//remove product controller
const removeProducts = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, msg: "product removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, msg: "error removing product" });
  }
};

//sigle product info controller
const singleProducts = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, msg: "error listing single product" });
  }
};

export { singleProducts, removeProducts, listProducts, addProduct };
