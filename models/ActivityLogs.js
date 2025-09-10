import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

const aSchema = new mongoose.Schema(
  {
    logno: {
      type: Number,
      unique: true,
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "Login",
        "Logout",
        "Failed Login",
        "Password Set",
        "Password Reset",
        "Create",
        "Cancel",
        "Update",
        "Generate",
        "Archive",
        "Recover",
        "Export",
        "Approve",
        "Reject",
        "Settle",
        "Pin",
        "Unpin",
        "Like",
        "Unlike",
        "Notify",
      ],
    },
    target: {
      type: String,
      required: true,
      enum: [
        "Employees",
        "Residents",
        "Households",
        "Blotter Reports",
        "Document Requests",
        "Court Reservations",
        "Announcements",
        "SOS",
        "River Snapshots",
        "Emergency Hotlines",
        "User Accounts",
        "Activity Logs",
        "Profile",
        "Username",
        "Password",
        "Security Questions",
        "Mobile Number",
      ],
    },
    description: {
      type: String,
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);
aSchema.plugin(AutoIncrement, { inc_field: "logno" });

const ActivityLog = mongoose.model("ActivityLog", aSchema);

export default ActivityLog;
