import mongoose from "mongoose";

const CertificateCounterSchema = new mongoose.Schema({
  _id: String,
  seq: Number,
});

const CertificateCounter = mongoose.model(
  "CertificateCounter",
  CertificateCounterSchema
);

const certSchema = new mongoose.Schema(
  {
    certno: { type: Number, unique: true, sparse: true },
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
    pdf: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Rejected",
        "Cancelled",
        "Collected",
        "Not Yet Collected",
      ],
      required: true,
      default: "Collected",
    },
  },
  { versionKey: false, timestamps: true }
);

async function assignCertNo(doc) {
  if (
    (!doc.certno && doc.status === "Not Yet Collected") ||
    doc.status === "Collected"
  ) {
    const counter = await CertificateCounter.findByIdAndUpdate(
      { _id: "certno" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    doc.certno = counter.seq;
  }
}

// Pre-save hook
certSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      await assignCertNo(this);
    } else if (
      (this.isModified("status") && this.status === "Not Yet Collected") ||
      (this.status === "Collected" && !this.certno)
    ) {
      await assignCertNo(this);
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Certificate = mongoose.model("Certificate", certSchema);

export default Certificate;
