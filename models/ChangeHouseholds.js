import mongoose from "mongoose";
import moment from "moment";

const hSchema = new mongoose.Schema(
  {
    householdno: {
      type: String,
    },
    members: [
      {
        resID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Resident",
          required: true,
        },
        position: {
          type: String,
          enum: [
            "Head",
            "Spouse",
            "Son",
            "Daughter",
            "Parent",
            "Sibling",
            "Grandparent",
            "Grandchild",
            "In-law",
            "Relative",
            "Housemate",
            "Househelp",
            "Other",
          ],
          required: true,
        },
      },
    ],
    vehicles: [
      {
        model: {
          type: String,
          required: true,
        },
        color: {
          type: String,
          required: true,
        },
        kind: {
          type: String,
          required: true,
        },
        platenumber: {
          type: String,
          required: true,
        },
      },
    ],
    ethnicity: { type: String, required: true },
    tribe: { type: String },
    sociostatus: { type: String, required: true },
    nhtsno: { type: String },
    watersource: { type: String, required: true },
    toiletfacility: { type: String, required: true },
    address: {
      type: String,
      required: true,
    },
    HOAname: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);

const ChangeHousehold = mongoose.model("ChangeHousehold", hSchema);

export default ChangeHousehold;
