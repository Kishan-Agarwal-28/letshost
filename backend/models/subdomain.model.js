import mongoose, { Schema } from "mongoose";
const subdomainSchema = new Schema(
  {
    subDomain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectID: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    public: {
      type: Boolean,
      default: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
export const SubDomain = mongoose.model("Subdomain", subdomainSchema);
