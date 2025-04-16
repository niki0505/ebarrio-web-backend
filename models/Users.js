import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
      enum: ["Resident", "Secretary", "Official", "Assistant Secretary"],
      default: "Resident",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Deactivated"],
      required: true,
      default: "Inactive",
    },
  },
  { versionKey: false }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
