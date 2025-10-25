import express from "express";
import { body, param } from "express-validator";
import {
  getReferralStats,
  validateReferralCode,
  getReferralHistory,
  getRecentReferrals,
} from "../controllers/referralController";
import { authenticate, optionalAuth } from "../middleware/auth";
import { handleValidationErrors } from "../utils/validation";

const router = express.Router();

// Get referral statistics (protected)
router.get("/stats", authenticate, getReferralStats);

// Get recent referrals (protected)
router.get("/recent", authenticate, getRecentReferrals);

// Validate referral code (public)
router.get(
  "/validate/:code",
  [
    param("code")
      .trim()
      .isLength({ min: 6, max: 10 })
      .withMessage("Invalid referral code format"),
    handleValidationErrors,
  ],
  optionalAuth,
  validateReferralCode
);

// Get referral history (protected)
router.get("/history", authenticate, getReferralHistory);

export default router;
