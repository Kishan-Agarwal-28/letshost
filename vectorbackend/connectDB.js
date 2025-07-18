import mongoose from "mongoose";
export let Image;
export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/subdomains`
    );
    Image = await connectionInstance.connection.db.collection("images");
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error(error);
    console.error("MongoDB connection failed");
    process.exit(0);
  }
};
