import mongoose from "mongoose";

const ehSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    contactnumber: {
      type: String,
      required: true,
    },
  },
  { versionKey: false }
);

const EmergencyHotline = mongoose.model("EmergencyHotline", ehSchema);

export default EmergencyHotline;
