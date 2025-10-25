import { Request, Response } from "express";
import { User } from "../models/User";
import { Referral } from "../models/Referral";
import { Purchase } from "../models/Purchase";

export const getReferralStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get total referrals
    const totalReferrals = await Referral.countDocuments({ referrer: userId });

    // Get successful referrals (those who made purchases)
    const successfulReferrals = await Referral.countDocuments({
      referrer: userId,
      status: "completed",
    });

    // Get pending referrals
    const pendingReferrals = await Referral.countDocuments({
      referrer: userId,
      status: "pending",
    });

    // Get total credits earned from referrals
    const user = await User.findById(userId);
    const totalCredits = user?.credits || 0;

    // Get recent referrals with user details
    const recentReferrals = await Referral.find({ referrer: userId })
      .populate("referred", "firstName lastName email createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        stats: {
          totalReferrals,
          successfulReferrals,
          pendingReferrals,
          totalCredits,
          conversionRate:
            totalReferrals > 0
              ? ((successfulReferrals / totalReferrals) * 100).toFixed(2)
              : 0,
        },
        recentReferrals: recentReferrals.map((ref) => ({
          id: ref._id,
          referredUser: ref.referred,
          status: ref.status,
          createdAt: ref.createdAt,
          completedAt: ref.completedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Get referral stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const validateReferralCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const currentUserId = req.user?.id; // Optional auth - may be null

    // Find user with this referral code
    const referrer = await User.findOne({ referralCode: code }).select(
      "firstName lastName referralCode"
    );

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: "Invalid referral code",
      });
    }

    // Check if user is trying to use their own referral code
    if (currentUserId && referrer._id.toString() === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot use your own referral code",
      });
    }

    return res.json({
      success: true,
      message: "Valid referral code",
      data: {
        referrer: {
          firstName: referrer.firstName,
          lastName: referrer.lastName,
          referralCode: referrer.referralCode,
        },
      },
    });
  } catch (error) {
    console.error("Validate referral code error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getRecentReferrals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 5;

    // Get recent referrals
    const referrals = await Referral.find({ referrer: userId })
      .populate("referred", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit);

    // Return referrals directly as array for frontend compatibility
    res.json(
      referrals.map((ref: any) => ({
        _id: ref._id,
        firstName: ref.referred.firstName,
        lastName: ref.referred.lastName,
        email: ref.referred.email,
        creditsEarned: ref.creditsEarned || 10, // Default credit amount
        status: ref.status,
        createdAt: ref.createdAt,
        completedAt: ref.completedAt,
      }))
    );
  } catch (error) {
    console.error("Get recent referrals error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getReferralHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get referrals with pagination
    const referrals = await Referral.find({ referrer: userId })
      .populate("referred", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalReferrals = await Referral.countDocuments({ referrer: userId });
    const totalPages = Math.ceil(totalReferrals / limit);

    // Return referrals directly as array for frontend compatibility
    res.json(
      referrals.map((ref: any) => ({
        _id: ref._id,
        firstName: ref.referred.firstName,
        lastName: ref.referred.lastName,
        email: ref.referred.email,
        creditsEarned: ref.creditsEarned || 10, // Default credit amount
        status: ref.status,
        createdAt: ref.createdAt,
        completedAt: ref.completedAt,
        purchaseDate: ref.completedAt, // Use completedAt as purchaseDate for frontend
      }))
    );
  } catch (error) {
    console.error("Get referral history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
