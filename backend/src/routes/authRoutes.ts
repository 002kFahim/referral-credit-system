import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { handleValidationErrors } from "../utils/validation";

const router = express.Router();

// Register route
router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters")
      .matches(/^[a-zA-Z0-9\s]+$/)
      .withMessage("First name must contain only letters, numbers, and spaces"),
    body("lastName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters")
      .matches(/^[a-zA-Z0-9\s]+$/)
      .withMessage("Last name must contain only letters, numbers, and spaces"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    body("referralCode")
      .optional()
      .trim()
      .isLength({ min: 6, max: 10 })
      .withMessage("Invalid referral code format")
      .matches(/^[A-Za-z0-9]{6,10}$/)
      .withMessage(
        "Referral code must be 6-10 characters (letters and numbers only)"
      ),
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

// Forgot password route
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    handleValidationErrors,
  ],
  forgotPassword
);

// Reset password route
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    handleValidationErrors,
  ],
  resetPassword
);

export default router;
