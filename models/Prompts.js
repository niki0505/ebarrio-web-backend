import mongoose from "mongoose";

const pSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    prompt: { type: String, required: true },
    response: { type: String },
    model: { type: String, default: "gemini-2.0" },
    isCleared: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

const Prompt = mongoose.model("Prompt", pSchema);

export default Prompt;
