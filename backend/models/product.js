const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  imageURL: {
    type: String,
    required: false,
    default: "/uploads/products/placeholder.png"
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    enum: ["kg", "ton"],
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);