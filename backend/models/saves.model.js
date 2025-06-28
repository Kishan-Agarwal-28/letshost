import mongoose, { Schema } from "mongoose";

const savesSchema = new Schema(
  {
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
      required: true,
    },
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Save = mongoose.model("Save", savesSchema);
