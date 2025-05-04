import mongoose from "mongoose";

const crSchema = new mongoose.Schema(
  {
    resID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    starttime: {
      type: Date,
      required: true,
    },
    endtime: {
      type: Date,
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      required: true,
      default: "Approved",
    },
    remarks: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);

const CourtReservation = mongoose.model("CourtReservation", crSchema);

export default CourtReservation;
