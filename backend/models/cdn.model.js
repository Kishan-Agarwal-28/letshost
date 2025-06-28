import mongoose, { Schema } from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const cdnSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cdnProjectID: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["js", "css", "image", "video"],
      required: true,
    },
    currentVersion: {
      type: Number,
      required: true,
    },
    previousVersion: {
      type: Number,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    bucketAssigned: {
      type: String,
      required: true,
    },
    relativePath: {
      type: String,
      required: true,
    },
    isTransformActive: {
      type: Boolean,
      default: false,
    },
    transformLimit: {
      type: Number,
      default: 0,
      max: 5,
    },
    secureUrl: {
      type: String,
      default: "",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

cdnSchema.plugin(mongooseAggregatePaginate);

export const CDN = mongoose.model("CDN", cdnSchema);
