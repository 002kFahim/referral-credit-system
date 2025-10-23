import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Referral } from '../models/Referral';
import { generateToken } from '../utils/jwt';

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
        message: 'User already exists with this email' 
      });
    }

    // Validate referral code if provided
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid referral code' 
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique referral code for new user
    const newReferralCode = await generateReferralCode();

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      referralCode: newReferralCode,
      referredBy: referrer?._id || null,
      credits: 0
    });

    await user.save();

    // Create referral relationship if referrer exists
    if (referrer) {
      const referral = new Referral({
        referrer: referrer._id,
        referred: user._id,
        status: 'pending'
      });
      await referral.save();
    }

    // Generate JWT token
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          referralCode: user.referralCode,
          credits: user.credits
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          referralCode: user.referralCode,
          credits: user.credits
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
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
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};