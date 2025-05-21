import Employee from "../models/Employees.js";
import Resident from "../models/Residents.js";
import mongoose from "mongoose";
import User from "../models/Users.js";

export const editEmployee = async (req, res) => {
  try {
    const { empID } = req.params;
    const { position, chairmanship } = req.body;
    const employee = await Employee.findById(empID);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.position = position;
    if (chairmanship) {
      employee.chairmanship = chairmanship;
    }
    await employee.save();

    if (employee.userID) {
      const user = await User.findById(employee.userID);
      if (user) {
        const positionRoleMap = {
          Secretary: "Secretary",
          Clerk: "Clerk",
          Justice: "Justice",
        };
        user.role = positionRoleMap[position] || "Official";
        await user.save();
      }
    }
    res
      .status(200)
      .json({ message: "Employee position updated successfully!" });
  } catch (error) {
    console.log("Error updating employee", error);
    res.status(500).json({ message: "Failed to update employee" });
  }
};

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
