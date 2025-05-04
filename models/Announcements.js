import mongoose from "mongoose";

const aSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    picture: {
      type: String,
    },
    uploadedby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    eventStart: {
      type: Date,
    },
    eventEnd: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Pinned", "Not Pinned", "Archived"],
      required: true,
      default: "Not Pinned",
    },
    hearts: {
      type: Number,
      default: 0,
    },
  },
  { versionKey: false, timestamps: true }
);

const Announcement = mongoose.model("Announcement", aSchema);

export default Announcement;
