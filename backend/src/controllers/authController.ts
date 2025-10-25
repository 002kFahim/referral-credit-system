import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User";
import { Referral } from "../models/Referral";
import { PasswordResetToken } from "../models/PasswordResetToken";
import { generateToken } from "../utils/jwt";
import { emailService } from "../services/emailService";

// Generate unique referral code
const generateReferralCode = async (): Promise<string> => {
  let code: string;
  let exists: boolean;

  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existingUser = await User.findOne({ referralCode: code });
    exists = !!existingUser;
  } while (exists);

  return code;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Validate referral code if provided
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code",
        });
      }
    }

    // Generate unique referral code for new user
    const newReferralCode = await generateReferralCode();

    // Create new user (password will be hashed by pre-save middleware)
    const user = new User({
      firstName,
      lastName,
      email,
      password, // Raw password - will be hashed by pre-save middleware
      referralCode: newReferralCode,
      referredBy: referrer?._id || null,
      credits: 0,
    });

    await user.save();

    // Create referral relationship if referrer exists
    if (referrer) {
      const referral = new Referral({
        referrer: referrer._id,
        referred: user._id,
        status: "pending",
      });
      await referral.save();

      // Send email notifications (async, don't wait for completion)
      emailService
        .sendReferralSuccessEmail(referrer, user)
        .catch(console.error);
      emailService
        .sendReferralWelcomeEmail(user, referrer)
        .catch(console.error);
    } else {
      // Send welcome email for regular registration
      emailService.sendWelcomeEmail(user).catch(console.error);
    }

    // Generate JWT token
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          referralCode: user.referralCode,
          credits: user.credits,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email and include password
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          referralCode: user.referralCode,
          credits: user.credits,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          referralCode: user.referralCode,
          credits: user.credits,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, we've sent password reset instructions.",
      });
    }

    // Clean up any existing tokens for this user
    const existingTokens = await PasswordResetToken.deleteMany({
      userId: user._id,
    });
    console.log(
      `🗑️  Cleaned up ${existingTokens.deletedCount} existing tokens for user: ${user.email}`
    );

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Create expiration time (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    const newTokenDoc = await PasswordResetToken.create({
      userId: user._id,
      token: resetToken,
      expiresAt,
    });
    console.log(
      `🔑 Created new reset token: ${newTokenDoc._id} for user: ${user.email}`
    );

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(
      user,
      resetToken,
      resetUrl
    );

    if (!emailSent) {
      console.error("Failed to send password reset email to:", email);
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again.",
      });
    }

    console.log(`Password reset email sent to: ${email}`);

    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, we've sent password reset instructions.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    console.log(
      `🔐 Password reset attempt for token: ${token.substring(0, 10)}...`
    );

    // Find valid reset token
    const resetTokenDoc = await PasswordResetToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetTokenDoc) {
      console.log(
        `❌ Token not found or invalid: ${token.substring(0, 10)}...`
      );
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    console.log(
      `✅ Valid token found - ID: ${resetTokenDoc._id}, Used: ${resetTokenDoc.used}, Expires: ${resetTokenDoc.expiresAt}`
    );

    // Find the user
    const user = await User.findById(resetTokenDoc.userId);
    if (!user) {
      console.log(`❌ User not found for token: ${resetTokenDoc._id}`);
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(`👤 User found: ${user.email}`);

    // Double-check the token is still valid (race condition protection)
    const doubleCheckToken = await PasswordResetToken.findOne({
      _id: resetTokenDoc._id,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!doubleCheckToken) {
      console.log(
        `❌ Token was used or expired during processing: ${resetTokenDoc._id}`
      );
      return res.status(400).json({
        success: false,
        message: "Token has already been used or expired",
      });
    }

    // Update user password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();
    console.log(`🔑 Password updated for user: ${user.email}`);

    // Mark token as used first (for logging/audit purposes)
    console.log(`🏷️  Marking token as used: ${resetTokenDoc._id}`);
    await resetTokenDoc.markAsUsed();

    // Verify the token was marked as used
    const verifyToken = await PasswordResetToken.findById(resetTokenDoc._id);
    console.log(
      `✅ Token verification after markAsUsed - Used: ${verifyToken?.used}, ID: ${verifyToken?._id}`
    );

    // Immediately delete ALL tokens for this user (including the one just used)
    // This ensures no token can be reused, even if there's a race condition
    const deletedTokens = await PasswordResetToken.deleteMany({
      userId: user._id,
    });
    console.log(
      `🗑️  Deleted ${deletedTokens.deletedCount} tokens for user: ${user.email} (including the used one)`
    );

    // Send confirmation email
    await emailService.sendPasswordResetConfirmationEmail(user);

    console.log(`Password reset successful for user: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
