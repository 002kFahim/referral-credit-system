import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  referralCode: string;
  referredBy?: string;
  credits: number;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateReferralCode(): string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    referralCode: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      minlength: 6,
      maxlength: 10,
    },
    referredBy: {
      type: String,
      ref: "User",
      default: null,
    },
    credits: {
      type: Number,
      default: 0,
      min: [0, "Credits cannot be negative"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Index for better query performance
userSchema.index({ referredBy: 1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to generate referral code (only if not already set)
userSchema.pre("save", function (next) {
  if (!this.referralCode) {
    // Generate a 6-character alphanumeric code
    this.referralCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) {
    throw new Error("Password not found for user");
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate referral code
userSchema.methods.generateReferralCode = function (): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const User = mongoose.model<IUser>("User", userSchema);
