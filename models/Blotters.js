import mongoose from "mongoose";
const BlotterCounterSchema = new mongoose.Schema({
  _id: String,
  seq: Number,
});

const BlotterCounter = mongoose.model("BlotterCounter", BlotterCounterSchema);

const bSchema = new mongoose.Schema(
  {
    blotterno: {
      type: Number,
      unique: true,
      sparse: true,
    },
    complainantID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
    },
    complainantname: {
      type: String,
    },
    complainantaddress: {
      type: String,
    },
    complainantcontactno: {
      type: String,
    },
    complainantsignature: {
      type: String,
    },
    subjectID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
    },
    subjectname: {
      type: String,
    },
    subjectaddress: {
      type: String,
    },
    subjectsignature: {
      type: String,
    },
    witnessID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
    },
    witnessname: {
      type: String,
    },
    witnesssignature: {
      type: String,
    },
    typeofthecomplaint: {
      type: String,
    },
    details: {
      type: String,
    },
    agreementdetails: {
      type: String,
    },
    starttime: {
      type: Date,
    },
    endtime: {
      type: Date,
    },
    remarks: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Scheduled", "Settled", "Rejected"],
      required: true,
      default: "Scheduled",
    },
    scheduleAt: { type: Date },
  },
  { versionKey: false, timestamps: true }
);
async function assignBlotterNo(doc) {
  if (!doc.blotterno && doc.status === "Settled") {
    const counter = await BlotterCounter.findByIdAndUpdate(
      { _id: "blotterno" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    doc.blotterno = counter.seq;
  }
}

// Pre-save hook
bSchema.pre("save", async function (next) {
  try {
    // If new document or status changed to "Issued" and certno not assigned yet
    if (this.isNew) {
      await assignBlotterNo(this);
    } else if (
      this.isModified("status") &&
      this.status === "Settled" &&
      !this.blotterno
    ) {
      await assignBlotterNo(this);
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Blotter = mongoose.model("Blotter", bSchema);

export default Blotter;
