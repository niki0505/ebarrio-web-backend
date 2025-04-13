import mongoose from "mongoose";
import { configDotenv } from "dotenv";

configDotenv();

const DATABASE_URL = process.env.DATABASE_URL;

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(DATABASE_URL);
    console.log(`Database connected to ${conn.connection.host}`);
  } catch (error) {
    console.log("Error connecting to database", error);
    process.exit(1);
  }
};
