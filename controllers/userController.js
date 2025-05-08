import Resident from "../models/Residents.js";
import mongoose from "mongoose";
import OldResident from "../models/OldResidents.js";
import OldUser from "../models/OldUsers.js";
import Employee from "../models/Employees.js";
import User from "../models/Users.js";
import OldEmployee from "../models/OldEmployees.js";
import moment from "moment";
import QRCode from "qrcode";
import {
  getEmployeesUtils,
  getResidentsUtils,
  getUsersUtils,
} from "../utils/collectionUtils.js";
import { rds } from "../index.js";
import axios from "axios";

export const activateUser = async (req, res) => {
  try {
    const { userID } = req.params;
    const user = await User.findById(userID);
    user.status = "Activated";

    await user.save();
    res.status(200).json({ message: "User activated successfully!" });
  } catch (error) {
    console.log("Error activating user", error);
    res.status(500).json({ message: "Failed to activate user" });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { userID } = req.params;
    const user = await User.findById(userID);
    user.status = "Deactivated";

    await user.save();
    res.status(200).json({ message: "User deactivated successfully!" });
  } catch (error) {
    console.log("Error deactivating user", error);
    res.status(500).json({ message: "Failed to deactivate user" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { username } = req.params;
    const { password, securityquestions } = req.body;
    const user = await User.findOne({ username: username });

    user.password = password;
    user.securityquestions = securityquestions;
    user.status = "Inactive";

    await user.save();

    rds.del(`userID_${user._id}`, (err, response) => {
      if (err) {
        console.error("Error deleting from Redis:", err);
      } else {
        console.log(`Deleted ${response} key from Redis`);
      }
    });

    console.log("✅ User reset password successfully!");
    return res
      .status(200)
      .json({ exists: true, message: "User reset password successfully" });
  } catch (error) {
    console.error("Error in resetting password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createUser = async (req, res) => {
  try {
    console.log("🔵 Register request:", req.body);
    const { username, password, resID, role } = req.body;

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      console.log("❌ Username already exists");
      return res.json({ usernameExists: true });
    }

    const resident = await Resident.findById(resID);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    let user;

    if (resident.empID) {
      user = new User({
        username,
        password,
        empID: resident.empID,
        role,
      });
    } else {
      user = new User({
        username,
        password,
        resID: resident._id,
        role,
      });
    }

    await user.save();

    if (resident.empID) {
      const employee = await Employee.findOne({ resID: resID });
      employee.userID = user._id;
      await employee.save();
    } else {
      const resident = await Resident.findOne({ _id: resID });
      resident.userID = user._id;
      await resident.save();
    }

    rds.setex(`userID_${user._id}`, 86400, password);

    await axios.post("https://api.semaphore.co/api/v4/priority", {
      apikey: "46d791fbe4e880554fcad1ee958bbf33",
      number: resident.mobilenumber,
      message: `Your barangay account is created. Use this temporary token as your password to log in: ${password}. 
       Please log in to the app and set your new password. This token will expire in 24 hours.`,
    });

    console.log("✅ User created successfully");
    return res
      .status(200)
      .json({ exists: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllOldUsers = async (req, res) => {
  try {
    const users = await OldUser.find();
    res.status(200).json(users);
  } catch (error) {
    console.log("Error fetching old users", error);
    res.status(500).json({ message: "Failed to fetch old users" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await getUsersUtils();
    res.status(200).json(users);
  } catch (error) {
    console.log("Error fetching users", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
