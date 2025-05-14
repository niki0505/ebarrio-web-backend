import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

const bSchema = new mongoose.Schema(
  {
    blotterno: {
      type: Number,
      unique: true,
    },
    complainantID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
    },
    complainantname: {
      type: String,
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
    type: {
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
      default: "Pending",
    },
    scheduleAt: { type: Date },
  },
  { versionKey: false, timestamps: true }
);
bSchema.plugin(AutoIncrement, { inc_field: "blotterno" });

const Blotter = mongoose.model("Blotter", bSchema);

export default Blotter;
