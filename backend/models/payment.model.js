import mongoose, { Schema } from "mongoose";
const paymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      validate(value) {
        if (value <= 0) throw new Error("Amount must be a positive number");
      },
    },
    currency: {
      type: String,
      required: true,
      enum: ["INR"], // Add more currencies as needed
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["credit_card", "paypal", "bank_transfer"], // Add more payment methods as needed
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);
export const Payment = mongoose.model("Payment", paymentSchema);
