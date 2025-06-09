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
  },
  { versionKey: false, timestamps: true }
);

const Household = mongoose.model("Household", hSchema);

export default Household;
