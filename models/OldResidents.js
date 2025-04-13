import mongoose from "mongoose";

const resSchema = new mongoose.Schema(
  {
    picture: {
      type: String,
      required: true,
    },
    signature: {
      type: String,
      required: true,
    },
    firstname: {
      type: String,
      required: true,
    },
    middlename: {
      type: String,
    },
    lastname: {
      type: String,
      required: true,
    },
    suffix: {
      type: String,
    },
    alias: {
      type: String,
    },
    salutation: {
      type: String,
    },
    sex: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
    },
    birthdate: {
      type: String,
      required: true,
    },
    birthplace: {
      type: String,
    },
    civilstatus: {
      type: String,
      required: true,
    },
    bloodtype: {
      type: String,
    },
    religion: {
      type: String,
    },
    nationality: {
      type: String,
      required: true,
    },
    voter: {
      type: String,
    },
    deceased: {
      type: String,
    },
    email: {
      type: String,
    },
    mobilenumber: {
      type: String,
      required: true,
    },
    telephone: {
      type: String,
    },
    facebook: {
      type: String,
    },
    emergencyname: {
      type: String,
      required: true,
    },
    emergencymobilenumber: {
      type: String,
      required: true,
    },
    emergencyaddress: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    mother: { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },
    father: { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },
    spouse: { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },
    siblings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resident",
      },
    ],
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resident",
      },
    ],
    HOAname: {
      type: String,
    },
    employmentstatus: {
      type: String,
    },
    occupation: {
      type: String,
    },
    monthlyincome: {
      type: String,
    },
    educationalattainment: {
      type: String,
    },
    typeofschool: {
      type: String,
    },
    course: {
      type: String,
    },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { versionKey: false }
);

const OldResident = mongoose.model("OldResident", resSchema);

export default OldResident;
