import mongoose, { Schema } from "mongoose";

const downloadSchema = new Schema(
  {
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
      required: true,
    },
    downloadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Download = mongoose.model("Download", downloadSchema);
