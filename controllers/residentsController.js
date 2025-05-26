import Employee from "../models/Employees.js";
import Resident from "../models/Residents.js";
import mongoose from "mongoose";
import User from "../models/Users.js";

export const recoverResident = async (req, res) => {
  try {
    const { resID } = req.params;

    const resident = await Resident.findById(resID);
    const existing = await Resident.findOne({
      firstname: resident.firstname,
      middlename: resident.middlename,
      lastname: resident.lastname,
      mobilenumber: resident.mobilenumber,
      status: { $ne: "Archived" },
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "This person is already an active resident." });
    }
    if (!resident) {
      return res.status(404).json({ message: "Resident not found." });
    }

    const user = await User.findOne({ resID: resident._id });

    if (user) {
      user.status = "Inactive";
      await user.save();
    }

    resident.status = "Active";
    await resident.save();

    return res.status(200).json({
      message: "Resident has been successfully recovered.",
    });
  } catch (error) {
    console.error("Error in recovering resident:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const archiveResident = async (req, res) => {
  try {
    const { resID } = req.params;

    const resident = await Resident.findById(resID);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found." });
    }

    const mother = await Resident.exists({ mother: resID });
    const father = await Resident.exists({ father: resID });
    const spouse = await Resident.exists({ spouse: resID });
    const sibling = await Resident.exists({ siblings: resID });
    const child = await Resident.exists({ children: resID });

    if (mother) {
      await Resident.updateMany({ mother: resID }, { $set: { mother: null } });
      console.log("Removed resident from mother.");
    }
    if (father) {
      await Resident.updateMany({ father: resID }, { $set: { father: null } });
      console.log("Removed resident from father.");
    }
    if (spouse) {
      await Resident.updateMany({ spouse: resID }, { $set: { spouse: null } });
      console.log("Removed resident from spouse.");
    }

    if (sibling) {
      await Resident.updateMany(
        { siblings: resID },
        { $pull: { siblings: resID } }
      );
      console.log("Removed resident from siblings list.");
    }

    if (child) {
      await Resident.updateMany(
        { children: resID },
        { $pull: { children: resID } }
      );
      console.log("Removed resident from children list.");
    }

    if (resident.userID) {
      const user = await User.findById(resident.userID);
      user.status = "Archived";
      await user.save();
    }

    if (resident.empID) {
      const emp = await Employee.findById(resident.empID);
      emp.status = "Archived";
      emp.set("employeeID", undefined);
      await emp.save();
      if (emp.userID) {
        const user = await User.findById(emp.userID);
        user.status = "Archived";
        await user.save();
      }
      resident.set("empID", undefined);
    }

    resident.set("brgyID", undefined);
    resident.status = "Archived";
    await resident.save();

    return res.status(200).json({
      message: "Resident has been successfully archived.",
    });
  } catch (error) {
    console.error("Error in archiving resident:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
