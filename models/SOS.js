import mongoose from "mongoose";

const SOSCounterSchema = new mongoose.Schema({
  _id: String,
  seq: Number,
});

const SOSCounter = mongoose.model("SOSCounter", SOSCounterSchema);

const sSchema = new mongoose.Schema(
  {
    SOSno: {
      type: Number,
      unique: true,
      sparse: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    reportdetails: { type: String },
    reporttype: { type: String },
    resID: { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },
    responder: [
      {
        empID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        status: {
          type: String,
          enum: ["Heading", "Arrived"],
          required: true,
        },
        arrivedat: {
          type: Date,
          default: null,
        },
      },
    ],
    postreportdetails: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Ongoing", "Resolved", "False Alarm", "Cancelled"],
      required: true,
      default: "Pending",
    },
  },
  { versionKey: false, timestamps: true }
);

async function assignSOSNo(doc) {
  if (
    !doc.SOSno &&
    (doc.status === "Resolved" ||
      doc.status === "False Alarm" ||
      doc.status === "Cancelled")
  ) {
    const counter = await SOSCounter.findByIdAndUpdate(
      { _id: "SOSno" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    doc.SOSno = counter.seq;
  }
}
// Pre-save hook
sSchema.pre("save", async function (next) {
  try {
    // If new document or status changed to "Issued" and certno not assigned yet
    if (this.isNew) {
      await assignSOSNo(this);
    } else if (
      this.isModified("status") &&
      (this.status === "Resolved" ||
        this.status === "False Alarm" ||
        doc.status === "Cancelled") &&
      !this.SOSno
    ) {
      await assignSOSNo(this);
    }
    next();
  } catch (err) {
    next(err);
  }
});

const SOS = mongoose.model("SOS", sSchema);

export default SOS;
