import mongoose, { Document, Schema } from "mongoose";

export interface IPurchase extends Document {
  user: mongoose.Types.ObjectId;
  productName: string;
  amount: number;
  currency: string;
  status: string;
  isFirstPurchase: boolean;
  referralCreditsAwarded: boolean;
  referralCredit?: {
    referrer: mongoose.Types.ObjectId;
    amount: number;
  };
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
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
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
      default: "completed",
      enum: ["pending", "completed", "failed"],
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
