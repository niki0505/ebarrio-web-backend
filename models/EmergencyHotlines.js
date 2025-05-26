import mongoose from "mongoose";

const ehSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    contactnumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Archived"],
      required: true,
      default: "Active",
    },
  },
  { versionKey: false }
);

const EmergencyHotline = mongoose.model("EmergencyHotline", ehSchema);

export default EmergencyHotline;
