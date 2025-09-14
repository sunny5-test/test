const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables first
dotenv.config();

const app = express();

// ✅ Allow frontend running on Live Server (port 5500)
app.use(cors({
  origin: [/http:\/\/127\.0\.0\.1:\d+$/, /http:\/\/localhost:\d+$/],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));

// Health check route
app.get("/", (req, res) => {
  res.json({ 
    message: "AgroChain API is running", 
    version: "1.0.0",
    endpoints: {
      "POST /api/auth/send-otp": "Send email OTP",
      "POST /api/auth/verify-otp": "Verify email OTP", 
      "POST /api/auth/verify-google": "Verify Google token",
      "POST /api/auth/signup": "Regular signup with email OTP",
      "POST /api/auth/signup-google": "Signup with Google OAuth"
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: "Something went wrong!" });
});

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({ 
    msg: "API endpoint not found", 
    path: req.path,
    method: req.method 
  });
});

module.exports = app;