import User from "../models/Users.js";
import Resident from "../models/Residents.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import crypto from "crypto";
import Session from "../models/Session.js";
import Employee from "../models/Employees.js";

import { configDotenv } from "dotenv";

configDotenv();
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

function generateSessionId() {
  return crypto.randomBytes(16).toString("hex");
}

export const refreshAccessToken = async (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }
    jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET,
      async (err, decodedRefresh) => {
        if (err) {
          return res.status(401).json({ message: "Invalid refresh token" });
        }
        const newAccessToken = jwt.sign(
          {
            userID: decodedRefresh.userID,
            empID: decodedRefresh.empID,
            role: decodedRefresh.role,
            name: decodedRefresh.name,
            picture: decodedRefresh.picture,
          },
          process.env.ACCESS_SECRET,
          {
            expiresIn: "15m",
          }
        );

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
          maxAge: 15 * 60 * 1000,
        });
        console.log("Access token refreshed");
        return res.status(200).json({
          message: "Access token refreshed",
          accessToken: newAccessToken,
        });
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const checkRefreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET,
      async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Invalid refresh token" });
        }
        return res.status(200).json({
          message: "Refresh token is still valid",
          decoded,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logoutUser = async (req, res) => {
  const { userID } = req.body;
  try {
    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
    user.status = "Inactive";
    await user.save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    console.log("🔵 Login request:", req.body);
    const { username, password } = req.body;

    const user = await User.findOne({ username }).populate({
      path: "empID",
      populate: {
        path: "resID",
      },
    });
    if (!user || user.role === "Resident") {
      console.log("❌ Account not found");
      return res.json({ exists: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Incorrect Password");
      return res.json({
        exists: true,
        correctPassword: false,
        isAuthorized: true,
      });
    }

    console.log("✅ Account found, generating token...");
    const accessToken = jwt.sign(
      {
        userID: user._id.toString(),
        empID: user.empID._id.toString(),
        role: user.role,
        name: `${user.empID.resID.firstname} ${user.empID.resID.lastname}`,
        picture: user.empID.resID.picture,
      },
      ACCESS_SECRET,
      {
        expiresIn: "15m",
      }
    );

    const refreshToken = jwt.sign(
      {
        userID: user._id.toString(),
        empID: user.empID._id.toString(),
        role: user.role,
        name: `${user.empID.resID.firstname} ${user.empID.resID.lastname}`,
        picture: user.empID.resID.picture,
      },
      REFRESH_SECRET,
      {
        expiresIn: "30d",
      }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    console.log("✅ Saving refresh and access token...");
    console.log(user.empID._id);

    user.status = "Active";
    await user.save();

    return res.json({
      exists: true,
      correctPassword: true,
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendOTP = async (req, res) => {
  try {
    const { mobilenumber } = req.body;
    const response = await axios.post("https://api.semaphore.co/api/v4/otp", {
      apikey: "46d791fbe4e880554fcad1ee958bbf33",
      number: mobilenumber,
      message:
        "Your one time password is {otp}. Please use it within 5 minutes.",
    });
    res.status(200).json({ otp: response.data[0]?.code });
  } catch (error) {
    console.error("Error in sending OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkUsername = async (req, res) => {
  try {
    console.log("🔍 Checking if username exists...", req.body);
    const { username } = req.body;

    const user = await User.findOne({ username });

    if (user) {
      console.log("❌ Username is already taken");
      return res.json({ usernameExists: true });
    }

    console.log("✅ Username is not found");
    return res.json({ usernameExists: false });
  } catch (error) {
    console.error("Error in checkResident:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkIfEmployee = async (req, res) => {
  try {
    console.log("🔍 Checking if resident exists...", req.body);
    const { firstname, lastname, mobilenumber } = req.body;

    const resident = await Resident.findOne({
      firstname,
      lastname,
      mobilenumber,
    });

    if (!resident) {
      console.log("❌ Resident not found");
      return res.json({ isResident: false });
    }

    if (!resident.empID) {
      console.log("❌ Resident is not an employee ");
      return res.json({ isEmployee: false });
    } else {
      const employee = await Resident.findOne({
        firstname,
        lastname,
        mobilenumber,
      }).populate("empID");

      if (employee.empID.position !== "Secretary") {
        console.log("❌ Resident is not a secretary");
        return res.json({
          isSecretary: false,
          isResident: true,
          isEmployee: true,
        });
      }

      if (employee.userID) {
        console.log("❌ Employee already has an account");
        return res.json({
          hasAccount: true,
          isSecretary: true,
          isResident: true,
          isEmployee: true,
        });
      }

      return res.json({
        empID: employee.empID._id,
        hasAccount: false,
        isSecretary: true,
        isEmployee: true,
        isResident: true,
      });
    }
  } catch (error) {
    console.error("Error in checkResident:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const registerUser = async (req, res) => {
  try {
    console.log("🔵 Register request:", req.body);
    const { username, password, empID, role } = req.body;

    const employee = await Employee.findOne({ _id: empID });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const user = new User({
      username: username,
      password: password,
      empID: empID,
      role: role,
    });

    await user.save();

    employee.userID = user._id;
    await employee.save();
    console.log("✅ User registered successfully");
    return res.json({ exists: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
