import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const fSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    status: {
      type: String,
      enum: ["Active", "Archived"],
      required: true,
      default: "Active",
    },
  },
  { versionKey: false, timestamps: true }
);

const FAQ = mongoose.model("FAQ", fSchema);

export default FAQ;
