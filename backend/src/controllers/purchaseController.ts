import { Request, Response } from "express";
import mongoose from "mongoose";
import { Purchase } from "../models/Purchase";
import { User } from "../models/User";
import { Referral } from "../models/Referral";

export const createPurchase = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const userId = req.user?.id;
      const { productName, amount, currency } = req.body;

      // Create purchase
      const purchase = new Purchase({
        user: userId,
        productName,
        amount,
        currency,
        status: "completed",
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
        await User.findByIdAndUpdate(
          referral.referrer,
          { $inc: { credits: creditAmount } },
          { session }
        );

        // Store credit information in purchase
        purchase.referralCredit = {
          referrer: referral.referrer,
          amount: creditAmount,
        };
        await purchase.save({ session });
      }

      res.status(201).json({
        success: true,
        message: "Purchase created successfully",
        data: {
          purchase: {
            id: purchase._id,
            productName: purchase.productName,
            amount: purchase.amount,
            currency: purchase.currency,
            status: purchase.status,
            createdAt: purchase.createdAt,
            referralCredit: purchase.referralCredit,
          },
        },
      });
    });
  } catch (error) {
    console.error("Create purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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

    res.json({
      success: true,
      data: {
        purchases: purchases.map((purchase) => ({
          id: purchase._id,
          productName: purchase.productName,
          amount: purchase.amount,
          currency: purchase.currency,
          status: purchase.status,
          createdAt: purchase.createdAt,
          referralCredit: purchase.referralCredit,
        })),
        summary: {
          totalSpent: totalSpent[0]?.total || 0,
          totalPurchases,
        },
        pagination: {
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get purchase history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
