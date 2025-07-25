import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const fSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { versionKey: false, timestamps: true }
);

const FAQ = mongoose.model("FAQ", fSchema);

export default FAQ;
