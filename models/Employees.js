import mongoose from "mongoose";

const empSchema = new mongoose.Schema(
  {
    employeeID: [
      {
        _id: false,
        idNumber: {
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
    ],
    resID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { versionKey: false }
);

const Employee = mongoose.model("Employee", empSchema);

export default Employee;
