import express from "express";
import { body } from "express-validator";
import {
  createPurchase,
  getPurchaseHistory,
} from "../controllers/purchaseController";
import { authenticate } from "../middleware/auth";
import { handleValidationErrors } from "../utils/validation";

const router = express.Router();

// Create purchase (protected)
router.post(
  "/",
  [
    body("description")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage(
        "Description is required and must be less than 200 characters"
      ),
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be greater than 0"),
    body("currency")
      .optional()
      .isIn(["USD", "EUR", "GBP"])
      .withMessage("Invalid currency"),
    body("creditsUsed")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Credits used must be a non-negative integer"),
    handleValidationErrors,
  ],
  authenticate,
  createPurchase
);

// Get purchase history (protected)
router.get("/history", authenticate, getPurchaseHistory);

export default router;
