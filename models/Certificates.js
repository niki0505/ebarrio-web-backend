import mongoose from "mongoose";

const certSchema = new mongoose.Schema(
  {
    certID: {
      _id: false,
      controlNumber: {
        type: String,
        required: true,
      },
      expirationDate: {
        type: String,
        required: true,
      },
      qrCode: {
        type: String,
        required: true,
      },
      qrToken: {
        type: String,
        required: true,
      },
    },
    resID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    typeofcertificate: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
    },
    businessname: {
      type: String,
    },
    lineofbusiness: {
      type: String,
    },
    locationofbusiness: {
      type: String,
    },
    orNumber: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Issued", "Rejected"],
      required: true,
      default: "Issued",
    },
  },
  { versionKey: false, timestamps: true }
);

const Certificate = mongoose.model("Certificate", certSchema);

export default Certificate;
