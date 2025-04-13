import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    resID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
    },
    role: {
      type: String,
      required: true,
      enum: ["resident", "secretary", "officials", "assistantsecretary"],
      default: "resident",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "deactivated"],
      required: true,
      default: "deactivated",
    },
  },
  { versionKey: false }
);

const OldUser = mongoose.model("OldUser", userSchema);

export default OldUser;
