import mongoose from "mongoose";
import moment from "moment";

const hSchema = new mongoose.Schema(
  {
    // householdno: {
    //   type: String,
    //   required: true,
    //   unique: true,
    // },
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
            "Child",
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
    status: {
      type: String,
      enum: ["Active", "Archived", "Pending", "Change Requested"],
      required: true,
      default: "Active",
    },
    ethnicity: { type: String, required: true },
    tribe: { type: String },
    sociostatus: { type: String, required: true },
    nhtsno: { type: String },
    watersource: { type: String, required: true },
    toiletfacility: { type: String, required: true },
  },
  { versionKey: false, timestamps: true }
);

const Household = mongoose.model("Household", hSchema);

export default Household;
