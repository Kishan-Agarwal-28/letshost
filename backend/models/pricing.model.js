import mongoose, { Schema } from "mongoose";

const pricingSchema = new Schema(
  {
    tier: {
      type: String,
      enum: ["free", "pro"],
      required: true,
      default: "free",
    },
    SDLimit: {
      type: Number,
      required: true,
      default: 10,
      validate(value) {
        if (value < 0) throw new Error("SDLimit must be a positive number");
      },
    },
    fileLimit: {
      type: Number,
      required: true,
      default: 0,
    },
    cdnCSSJSlimit: {
      type: Number,
      default: 0,
    },
    cdnMedialimit: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Pricing = mongoose.model("Pricing", pricingSchema);
