import mongoose from "mongoose";

const nSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String },
    message: { type: String },
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
    redirectTo: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);

const Notification = mongoose.model("Notification", nSchema);

export default Notification;
