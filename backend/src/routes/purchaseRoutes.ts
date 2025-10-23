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
    body("productName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Product name is required"),
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be greater than 0"),
    body("currency")
      .isIn(["USD", "EUR", "GBP"])
      .withMessage("Invalid currency"),
    handleValidationErrors,
  ],
  authenticate,
  createPurchase
);

// Get purchase history (protected)
router.get("/history", authenticate, getPurchaseHistory);

export default router;
