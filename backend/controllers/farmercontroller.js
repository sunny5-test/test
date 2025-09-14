const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");
const mongoose = require("mongoose");
const multer = require("multer"); 
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const path = require("path");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "agrochain/products",
    format: async (req, file) => 'png',
    public_id: (req, file) => 'product-' + Date.now(),
  },
});

const upload = multer({ storage: storage });

// Get farmer overview data
exports.getOverview = async (req, res) => {
    try {
        const { farmerId } = req.params;

        const totalSales = 0; 
        const productsInInventory = await Product.countDocuments({ farmer: farmerId });

        const acceptedOrders = []; 

        let overallRevenue = 0;
        const frequentBuyers = []; 

        res.json({
            totalSales,
            overallRevenue,
            productsInInventory,
            recentSales: acceptedOrders,
            frequentBuyers,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch overview data" });
    }
};

// Add a new product
exports.addProduct = async (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ msg: "Failed to upload image" });
        }
        try {
            const { farmerId, name, price, quantity, unit } = req.body;
            const imageURL = req.file ? req.file.path : "/uploads/products/placeholder.png";
    
            if (!farmerId || !name || !price || !quantity || !unit) {
                return res.status(400).json({ msg: "Missing required product fields" });
            }
    
            const newProduct = new Product({
                farmer: farmerId,
                name,
                imageURL,
                price,
                quantity,
                unit,
            });
    
            await newProduct.save();
            res.status(201).json({ msg: "Product added successfully", product: newProduct });
        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Failed to add product" });
        }
    });
};

// Get all products for a farmer
exports.getProducts = async (req, res) => {
    try {
        const { farmerId } = req.params;
        const products = await Product.find({ farmer: farmerId });
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch products" });
    }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        await Product.findByIdAndDelete(productId);
        res.json({ msg: "Product deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to delete product" });
    }
};

// Update a product
exports.updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updateData = req.body;

        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ msg: "Product not found" });
        }

        res.json({ msg: "Product updated successfully", product: updatedProduct });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to update product" });
    }
};

// Get farmer profile details
exports.getProfile = async (req, res) => {
    try {
        const { farmerId } = req.params;
        const user = await User.findById(farmerId, 'firstName lastName email mobile aadhaar farmLocation cropsGrown');
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch profile" });
    }
};

// Update farmer profile
exports.updateProfile = async (req, res) => {
    try {
        const { farmerId } = req.params;
        const updateData = req.body;

        const user = await User.findByIdAndUpdate(farmerId, updateData, { new: true });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json({ msg: "Profile updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to update profile" });
    }
};