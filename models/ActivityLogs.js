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
