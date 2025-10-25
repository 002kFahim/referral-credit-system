import mongoose, { Document, Schema } from "mongoose";

export interface IPasswordResetToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;

  // Instance methods
  isValid(): boolean;
  markAsUsed(): Promise<IPasswordResetToken>;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // MongoDB TTL index for automatic cleanup
  },
  used: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient queries
passwordResetTokenSchema.index({ userId: 1, used: 1 });

// Static method to clean up expired tokens
passwordResetTokenSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    $or: [{ expiresAt: { $lt: new Date() } }, { used: true }],
  });
};

// Instance method to check if token is valid
passwordResetTokenSchema.methods.isValid = function (): boolean {
  return !this.used && this.expiresAt > new Date();
};

// Instance method to mark token as used
passwordResetTokenSchema.methods.markAsUsed = function () {
  this.used = true;
  return this.save();
};

export const PasswordResetToken = mongoose.model<IPasswordResetToken>(
  "PasswordResetToken",
  passwordResetTokenSchema
);
