import mongoose, { Document, Schema } from "mongoose";

export interface IReferral extends Document {
  referrer: mongoose.Types.ObjectId;
  referred: mongoose.Types.ObjectId;
  status: "pending" | "completed" | "converted" | "expired";
  creditsEarned: number;
  convertedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    referrer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Referrer is required"],
    },
    referred: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Referred user is required"],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "converted", "expired"],
      default: "pending",
    },
    creditsEarned: {
      type: Number,
      default: 0,
      min: [0, "Credits earned cannot be negative"],
    },
    convertedAt: {
      type: Date,
      default: null,
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

// Compound index to prevent duplicate referrals
referralSchema.index({ referrer: 1, referred: 1 }, { unique: true });
referralSchema.index({ status: 1 });
referralSchema.index({ createdAt: 1 });

export const Referral = mongoose.model<IReferral>("Referral", referralSchema);
