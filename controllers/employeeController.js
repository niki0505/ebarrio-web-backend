import Employee from "../models/Employees.js";
import Resident from "../models/Residents.js";
import mongoose from "mongoose";

export const createEmployee = async (req, res) => {
  try {
    const { formattedEmployeeForm } = req.body;
    const resident = await Resident.findOne({
      _id: formattedEmployeeForm.resID,
    });
    const resIDasObjectId = new mongoose.Types.ObjectId(
      formattedEmployeeForm.resID
    );

    delete formattedEmployeeForm.resID;
    const employee = new Employee({
      resID: resIDasObjectId,
      ...formattedEmployeeForm,
    });
    await employee.save();

    resident.empID = employee._id;
    await resident.save();
    res.status(200).json({ empID: employee._id });
  } catch (error) {
    console.log("Error creating employee", error);
    res.status(500).json({ message: "Failed to create employee" });
  }
};

export const checkWeeks = async (req, res) => {
  try {
    const counts = await Employee.aggregate([
      {
        $group: {
          _id: { $toLower: "$assignedweeks" },
          count: { $sum: 1 },
        },
      },
    ]);

    const positionMap = {};
    counts.forEach((pos) => {
      positionMap[pos._id] = pos.count;
    });

    res.json(positionMap);
  } catch (err) {
    console.error("Error fetching weeks", err);
    res.status(500).json({ message: "Failed to get weeks" });
  }
};

export const checkPositions = async (req, res) => {
  try {
    const counts = await Employee.aggregate([
      {
        $group: {
          _id: { $toLower: "$position" },
          count: { $sum: 1 },
        },
      },
    ]);

    const positionMap = {};
    counts.forEach((pos) => {
      positionMap[pos._id] = pos.count;
    });

    res.json(positionMap);
  } catch (err) {
    console.error("Error fetching position counts", err);
    res.status(500).json({ message: "Failed to get position counts" });
  }
};
