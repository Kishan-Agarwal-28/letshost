import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const imageSchema = new Schema(
  {
    title: { type: String },
    description: { type: String },
    prompt: { type: String },
    public_id: { type: String, required: true },
    imageUrl: { type: String, required: true },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [{ type: String }],
    uploaded: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

imageSchema.plugin(mongooseAggregatePaginate);

export const Image = mongoose.model("Image", imageSchema);
