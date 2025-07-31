import mongoose from "mongoose";

const cSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    messages: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        to: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: { type: String, required: true },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Ended", "Pending"],
      required: true,
    },
    isCleared: { type: Boolean, default: false },
    isBot: { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: true }
);

const Chat = mongoose.model("Chat", cSchema);

export default Chat;
