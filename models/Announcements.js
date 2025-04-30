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
  },
  { versionKey: false, timestamps: true }
);

const Announcement = mongoose.model("Announcement", aSchema);

export default Announcement;
