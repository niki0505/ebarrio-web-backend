import Employee from "../models/Employees.js";
import Resident from "../models/Residents.js";
import mongoose from "mongoose";
import User from "../models/Users.js";
import ActivityLog from "../models/ActivityLogs.js";

export const recoverEmployee = async (req, res) => {
  try {
    const { empID } = req.params;
    const { userID, role } = req.user;

    const emp = await Employee.findById(empID);

    const existing = await Employee.findOne({
      resID: emp.resID,
      status: { $in: "Active" },
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "This person is already an active employee." });
    }

    const resident = await Resident.findOne({
      _id: emp.resID,
      status: "Active",
    });

    if (!resident) {
      return res
        .status(409)
        .json({ message: "This person is not a registered resident." });
    }

    if (resident.userID) {
      const user = await User.findById(resident.userID);
      user.status = "Archived";
      await user.save();
      resident.set("userID", undefined);
      await resident.save();
    }

    if (emp.userID) {
      const user = await User.findById(emp.userID);
      if (!user.passwordistoken) {
        user.status = "Inactive";
      } else {
        user.status = "Password Not Set";
      }
      await user.save();
    }

    resident.set("empID", emp._id);
    await resident.save();

    emp.status = "Active";

    await emp.save();

    if (role !== "Technical Admin") {
      await ActivityLog.insertOne({
        userID,
        action: "Recover",
        target: "Employees",
        description: `User recovered ${resident.lastname}, ${resident.firstname}'s as employee.`,
      });
    }

    return res.status(200).json({
      message: "Employee has been successfully recovered.",
    });
  } catch (error) {
    console.error("Error in recovering employee:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const archiveEmployee = async (req, res) => {
  try {
    const { empID } = req.params;
    const { userID, role } = req.user;

    const emp = await Employee.findById(empID);
    if (!emp) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const resident = await Resident.findById(emp.resID);

    if (emp.userID) {
      const user = await User.findById(emp.userID);
      user.status = "Archived";
      await user.save();
    }

    const existingResUser = await User.findOne({
      resID: resident._id,
      role: "Resident",
      status: "Archived",
    });

    if (existingResUser) {
      if (!existingResUser.passwordistoken) {
        existingResUser.status = "Inactive";
      } else {
        existingResUser.status = "Password Not Set";
      }
      resident.set("userID", existingResUser._id);

      await existingResUser.save();
    }

    resident.set("empID", undefined);
    await resident.save();

    emp.status = "Archived";
    emp.set("employeeID", undefined);

    await emp.save();

    if (role !== "Technical Admin") {
      await ActivityLog.insertOne({
        userID,
        action: "Archive",
        target: "Employees",
        description: `User archived ${resident.lastname}, ${resident.firstname}'s as employee.`,
      });
    }

    return res.status(200).json({
      message: "Employee has been successfully archived.",
    });
  } catch (error) {
    console.error("Error in archiving employee:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editEmployee = async (req, res) => {
  try {
    const { empID } = req.params;
    const { userID, role } = req.user;
    const { position, chairmanship } = req.body;
    const employee = await Employee.findById(empID).populate({
      path: "resID",
      select: "firstname lastname",
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const oldPosition = employee.position;
    employee.position = position;
    if (chairmanship) {
      employee.chairmanship = chairmanship;
    }
    await employee.save();

    const normalizeRole = (pos) => {
      const personnelPositions = ["Tanod", "Kagawad", "Captain"];
      return personnelPositions.includes(pos) ? "Personnel" : pos;
    };

    const normalizedRole = normalizeRole(position);

    if (employee.userID) {
      const user = await User.findById(employee.userID);
      if (user) {
        if (oldPosition === position) {
          return;
        }
        const restrictedPositions = ["Secretary", "Clerk", "Justice"];

        // Changes position from personnel to secretary, clerk, justice
        if (restrictedPositions.includes(position)) {
          user.status = "Archived";
          await user.save();
          employee.set("userID", undefined);
          await employee.save();
        } else {
          // Changes position from secretary, clerk, justice to personnel
          if (
            user.role === "Secretary" ||
            user.role === "Clerk" ||
            user.role === "Justice"
          ) {
            user.status = "Archived";
            await user.save();
            employee.set("userID", undefined);
            await employee.save();
          }
        }
      }
    } else {
      // Checks if they already have an account
      const existingUser = await User.findOne({
        empID: employee._id,
        role: normalizedRole,
        status: "Archived",
      });

      if (existingUser) {
        if (!existingUser.passwordistoken) {
          existingUser.status = "Inactive";
        } else {
          existingUser.status = "Password Not Set";
        }
        await existingUser.save();
        employee.set("userID", existingUser._id);
        await employee.save();
      }
    }

    if (role !== "Technical Admin") {
      await ActivityLog.insertOne({
        userID,
        action: "Update",
        target: "Employees",
        description: `User updated ${employee.resID.lastname}, ${employee.resID.firstname}'s employee profile.`,
      });
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
    const { userID, role } = req.user;
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

    const existingEmp = await Employee.findOne({
      resID: resIDasObjectId,
      status: "Archived",
      position: formattedEmployeeForm.position,
    });

    if (existingEmp) {
      return res.status(409).json({
        message: `An archived employee already exists with the ${formattedEmployeeForm.position.toLowerCase()} position. Please recover their archived record instead of creating a new one.`,
      });
    }

    const existingEmpUser = await User.find({
      empID: employee._id,
      status: "Archived",
      role: formattedEmployeeForm.position,
    });

    if (existingEmpUser) {
      if (!existingEmpUser.passwordistoken) {
        existingEmpUser.status = "Inactive";
      } else {
        existingEmpUser.status = "Password Not Set";
      }
      employee.set("userID", existingEmpUser._id);
      await existingEmpUser.save();
    }
    await employee.save();

    if (resident.userID) {
      const user = await User.findById(resident.userID);
      user.status = "Archived";
      await user.save();
      resident.set("userID", undefined);
    }

    resident.empID = employee._id;
    await resident.save();

    if (role !== "Technical Admin") {
      await ActivityLog.insertOne({
        userID,
        action: "Create",
        target: "Employees",
        description: `User added ${resident.lastname}, ${resident.firstname} as employee.`,
      });
    }
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
        $match: {
          status: { $ne: "Archived" },
        },
      },
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
