import mongoose from "mongoose";

const ReservationCounterSchema = new mongoose.Schema({
  _id: String,
  seq: Number,
});

const ReservationCounter = mongoose.model(
  "ReservationCounter",
  ReservationCounterSchema
);

const crSchema = new mongoose.Schema(
  {
    reservationno: { type: Number, unique: true, sparse: true },
    resID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    times: {
      type: Map,
      of: new mongoose.Schema({
        starttime: { type: Date, required: true },
        endtime: { type: Date, required: true },
      }),
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      required: true,
      default: "Approved",
    },
    remarks: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);

async function assignReservationNo(doc) {
  if (!doc.reservationno && doc.status === "Approved") {
    const counter = await ReservationCounter.findByIdAndUpdate(
      { _id: "reservationno" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    doc.reservationno = counter.seq;
  }
}

// Pre-save hook
crSchema.pre("save", async function (next) {
  try {
    // Only assign if status is Approved and reservationno missing
    if (
      (this.isNew || this.isModified("status")) &&
      this.status === "Approved" &&
      !this.reservationno
    ) {
      await assignReservationNo(this);
    }
    next();
  } catch (err) {
    next(err);
  }
});

const CourtReservation = mongoose.model("CourtReservation", crSchema);

export default CourtReservation;
