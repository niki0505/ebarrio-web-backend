import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  sessionID: { type: String, required: true, unique: true },
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Session", sessionSchema);
