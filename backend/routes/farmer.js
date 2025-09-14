const express = require("express");
const router = express.Router();
const farmerController = require("../controllers/farmercontroller");

// Farmer dashboard routes
router.get("/overview/:farmerId", farmerController.getOverview);
router.post("/products", farmerController.addProduct);
router.get("/products/:farmerId", farmerController.getProducts);
router.put("/products/:productId", farmerController.updateProduct);
router.delete("/products/:productId", farmerController.deleteProduct);
router.get("/profile/:farmerId", farmerController.getProfile);
router.put("/profile/:farmerId", farmerController.updateProfile);

module.exports = router;