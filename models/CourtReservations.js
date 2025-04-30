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
    datetime: {
      type: String,
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
      default: "Pending",
    },
  },
  { versionKey: false, timestamps: true }
);

const CourtReservation = mongoose.model("CourtReservation", crSchema);

export default CourtReservation;
