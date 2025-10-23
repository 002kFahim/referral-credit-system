import express from "express";
import { body } from "express-validator";
import { register, login, getProfile } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { handleValidationErrors } from "../utils/validation";

const router = express.Router();

// Register route
router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("First name must be at least 2 characters"),
    body("lastName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Last name must be at least 2 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("referralCode")
      .optional()
      .trim()
      .isLength({ min: 6, max: 10 })
      .withMessage("Invalid referral code format"),
    handleValidationErrors,
  ],
  register
);

// Login route
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
  ],
  login
);

// Get profile route (protected)
router.get("/profile", authenticate, getProfile);

export default router;
