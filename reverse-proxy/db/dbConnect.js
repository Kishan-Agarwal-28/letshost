import mongoose from "mongoose";

export const dbConnect = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/subdomains`);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};
