import mongoose from "mongoose";
import moment from "moment";

const resSchema = new mongoose.Schema(
  {
    brgyID: [
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
    age: {
      type: Number,
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
    precinct: {
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
    course: {
      type: String,
    },
    isSenior: {
      type: Boolean,
      default: false,
    },
    isInfant: {
      type: Boolean,
      default: false,
    },
    isNewborn: {
      type: Boolean,
      default: false,
    },
    isUnder5: {
      type: Boolean,
      default: false,
    },
    isSchoolAge: {
      type: Boolean,
      default: false,
    },
    isAdolescent: {
      type: Boolean,
      default: false,
    },
    isAdolescentPregnant: {
      type: Boolean,
      default: false,
    },
    isAdult: {
      type: Boolean,
      default: false,
    },
    isPostpartum: {
      type: Boolean,
      default: false,
    },
    isWomenOfReproductive: {
      type: Boolean,
      default: false,
    },
    isPregnant: {
      type: Boolean,
      default: false,
    },
    isPWD: {
      type: Boolean,
      default: false,
    },
    philhealthid: { type: String },
    philhealthtype: { type: String },
    philhealthcategory: { type: String },
    haveHypertension: {
      type: Boolean,
      default: false,
    },
    haveDiabetes: {
      type: Boolean,
      default: false,
    },
    haveTubercolosis: {
      type: Boolean,
      default: false,
    },
    haveSurgery: {
      type: Boolean,
      default: false,
    },
    lastmenstrual: { type: String },
    haveFPmethod: {
      type: String,
    },
    fpmethod: { type: String },
    fpstatus: { type: String },
    householdno: { type: mongoose.Schema.Types.ObjectId, ref: "Household" },
    householdposition: { type: String },
    head: { type: String },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    empID: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  { versionKey: false }
);

resSchema.methods.updateAge = function () {
  this.age = moment().diff(moment(this.birthdate), "years");
};
const ChangeResident = mongoose.model("ChangeResident", resSchema);

export default ChangeResident;
