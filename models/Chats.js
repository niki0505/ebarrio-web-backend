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
        _id: false,
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

cSchema.pre("save", function (next) {
  if (this.messages.length > 0) {
    const lastMessage = this.messages[this.messages.length - 1].message;

    if (lastMessage === "This chat has ended.") {
      this.status = "Ended"; // force Ended
    }
  }

  next();
});

cSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  // Block manual status change if already Ended
  if (update.status && update.status !== "Ended") {
    // Force status back if chat is ended
    this.model.findOne(this.getQuery()).then((doc) => {
      if (doc && doc.status === "Ended") {
        // override attempted update
        this.setUpdate({ ...update, status: "Ended" });
      }
      next();
    });
  } else {
    next();
  }
});

const Chat = mongoose.model("Chat", cSchema);

export default Chat;
