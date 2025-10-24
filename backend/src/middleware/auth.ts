import { Request, Response, NextFunction } from "express";
import { verifyToken, JWTPayload } from "../utils/jwt";
import { User, IUser } from "../models/User";
import { asyncHandler } from "./errorHandler";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    referralCode: string;
    credits: number;
  };
}

// Extend Express Request interface globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        referralCode: string;
        credits: number;
      };
    }
  }
}

export const authenticate = asyncHandler(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    let token: string | undefined;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
      return;
    }

    try {
      // Verify token
      const decoded: JWTPayload = verifyToken(token);

      // Get user from database
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Token is valid but user not found.",
        });
        return;
      }

      // Add user to request object
      req.user = {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        referralCode: user.referralCode,
        credits: user.credits,
      };
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
      return;
    }
  }
);

export const optionalAuth = asyncHandler(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        const decoded: JWTPayload = verifyToken(token);
        const user = await User.findById(decoded.userId).select("-password");
        if (user) {
          req.user = {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            referralCode: user.referralCode,
            credits: user.credits,
          };
        }
      } catch (error) {
        // Token is invalid, but we continue without user
      }
    }

    next();
  }
);
