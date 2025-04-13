import mongoose from "mongoose";

const empSchema = new mongoose.Schema(
  {
    resID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { versionKey: false }
);

const OldEmployee = mongoose.model("OldEmployee", empSchema);

export default OldEmployee;
