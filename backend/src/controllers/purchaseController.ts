import { Request, Response } from "express";
import mongoose from "mongoose";
import { Purchase } from "../models/Purchase";
import { User } from "../models/User";
import { Referral } from "../models/Referral";
import { emailService } from "../services/emailService";

export const createPurchase = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const userId = req.user?.id;
      const {
        description,
        amount,
        currency = "USD",
        creditsUsed = 0,
      } = req.body;

      // Validate user has enough credits if using credits
      if (creditsUsed > 0) {
        const user = await User.findById(userId).session(session);
        if (!user || user.credits < creditsUsed) {
          throw new Error("Insufficient credits");
        }

        // Deduct credits from user
        await User.findByIdAndUpdate(
          userId,
          { $inc: { credits: -creditsUsed } },
          { session }
        );
      }

      // Create purchase
      const purchase = new Purchase({
        user: userId,
        description,
        amount,
        currency,
        creditsUsed,
        status: "completed", // Auto-complete for demo purposes
        completedAt: new Date(),
      });

      await purchase.save({ session });

      // Check if user was referred and update referral status
      const referral = await Referral.findOne({
        referred: userId,
        status: "pending",
      }).session(session);

      if (referral) {
        // Mark referral as completed
        referral.status = "completed";
        referral.completedAt = new Date();
        await referral.save({ session });

        // Award credits to referrer (10% of purchase amount)
        const creditAmount = Math.floor(amount * 0.1);
        const referrerUser = await User.findByIdAndUpdate(
          referral.referrer,
          { $inc: { credits: creditAmount } },
          { session, new: true }
        );

        // Store credit information in purchase
        purchase.referralCredit = {
          referrer: referral.referrer,
          amount: creditAmount,
        };
        await purchase.save({ session });

        // Send email notification to referrer (async, don't wait)
        if (referrerUser && req.user) {
          emailService
            .sendCreditsEarnedEmail(referrerUser, creditAmount, {
              name: `${req.user.firstName} ${req.user.lastName}`,
              email: req.user.email,
              amount: amount,
              description: description,
            })
            .catch(console.error);
        }
      }

      res.status(201).json({
        success: true,
        message: "Purchase created successfully",
        data: {
          _id: purchase._id,
          description: purchase.description,
          amount: purchase.amount,
          currency: purchase.currency,
          status: purchase.status,
          creditsUsed: purchase.creditsUsed,
          createdAt: purchase.createdAt,
          completedAt: purchase.completedAt,
          referralCredit: purchase.referralCredit,
        },
      });
    });
  } catch (error: any) {
    console.error("Create purchase error:", error);

    let statusCode = 500;
    let message = "Internal server error";

    if (error.message === "Insufficient credits") {
      statusCode = 400;
      message = "Insufficient credits for this purchase";
    } else if (error.name === "ValidationError") {
      statusCode = 400;
      message = "Invalid purchase data";
    }

    res.status(statusCode).json({
      success: false,
      message,
    });
  } finally {
    await session.endSession();
  }
};

export const getPurchaseHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get purchases with pagination
    const purchases = await Purchase.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalPurchases = await Purchase.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalPurchases / limit);

    // Calculate total spent
    const totalSpent = await Purchase.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Return purchases directly as array for frontend compatibility
    res.json(
      purchases.map((purchase) => ({
        _id: purchase._id,
        description: purchase.description,
        amount: purchase.amount,
        currency: purchase.currency,
        status: purchase.status,
        creditsUsed: purchase.creditsUsed,
        createdAt: purchase.createdAt,
        completedAt: purchase.completedAt,
        referralCredit: purchase.referralCredit,
      }))
    );
  } catch (error) {
    console.error("Get purchase history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
