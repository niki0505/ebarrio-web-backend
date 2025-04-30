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
  },
  { versionKey: false }
);

const OldEmergencyHotline = mongoose.model("OldEmergencyHotline", ehSchema);

export default OldEmergencyHotline;
