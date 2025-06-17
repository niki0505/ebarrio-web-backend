import mongoose from "mongoose";
import moment from "moment";

const hSchema = new mongoose.Schema(
  {
    householdno: {
      type: String,
      unique: true,
      match: /^HH-\d{4}$/,
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
      enum: ["Active", "Archived", "Pending", "Change Requested", "Rejected"],
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

hSchema.pre("save", async function (next) {
  if (this.isNew && this.status === "Active" && !this.householdno) {
    const latest = await this.constructor
      .findOne({ householdno: { $regex: /^HH-\d{4}$/ } })
      .sort({ createdAt: -1 });

    let nextNumber = 1;

    if (latest && latest.householdno) {
      const lastNum = parseInt(latest.householdno.split("-")[1], 10);
      nextNumber = lastNum + 1;
    }

    this.householdno = `HH-${String(nextNumber).padStart(4, "0")}`;
  }

  next();
});

const Household = mongoose.model("Household", hSchema);

export default Household;
