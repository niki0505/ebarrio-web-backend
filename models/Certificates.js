import mongoose from "mongoose";

const certSchema = new mongoose.Schema(
  {
    certID: {
      _id: false,
      type: {
        controlNumber: {
          type: String,
          required: function () {
            return this.status !== "Pending";
          },
        },
        expirationDate: {
          type: String,
          required: function () {
            return this.status !== "Pending";
          },
        },
        qrCode: {
          type: String,
          required: function () {
            return this.status !== "Pending";
          },
        },
        qrToken: {
          type: String,
          required: function () {
            return this.status !== "Pending";
          },
        },
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
    amount: {
      type: String,
    },
    remarks: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Issued", "Rejected", "Cancelled"],
      required: true,
      default: "Issued",
    },
  },
  { versionKey: false, timestamps: true }
);

const Certificate = mongoose.model("Certificate", certSchema);

export default Certificate;
