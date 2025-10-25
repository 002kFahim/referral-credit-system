import mongoose, { Document, Schema } from "mongoose";

export interface IPurchase extends Document {
  user: mongoose.Types.ObjectId;
  productName?: string; // Made optional for backward compatibility
  description: string; // New field to match frontend
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  creditsUsed: number; // New field to track credits used
  isFirstPurchase: boolean;
  referralCreditsAwarded: boolean;
  referralCredit?: {
    referrer: mongoose.Types.ObjectId;
    amount: number;
  };
  completedAt?: Date; // New field to track completion time
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    productName: {
      type: String,
      trim: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be positive"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      uppercase: true,
      default: "USD",
      enum: ["USD", "EUR", "GBP"],
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "completed", "failed"],
    },
    creditsUsed: {
      type: Number,
      default: 0,
      min: [0, "Credits used cannot be negative"],
    },
    isFirstPurchase: {
      type: Boolean,
      default: false,
    },
    referralCreditsAwarded: {
      type: Boolean,
      default: false,
    },
    referralCredit: {
      referrer: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      amount: {
        type: Number,
        min: 0,
      },
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
purchaseSchema.index({ user: 1 });
purchaseSchema.index({ createdAt: -1 });
purchaseSchema.index({ isFirstPurchase: 1 });

export const Purchase = mongoose.model<IPurchase>("Purchase", purchaseSchema);
