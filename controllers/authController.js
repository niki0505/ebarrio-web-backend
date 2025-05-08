import User from "../models/Users.js";
import Resident from "../models/Residents.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import crypto from "crypto";
import Session from "../models/Session.js";
import Employee from "../models/Employees.js";
import { rds } from "../index.js";

import { configDotenv } from "dotenv";

configDotenv();
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

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
            username: decodedRefresh.username,
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
    const { username } = req.params;

    const user = await User.findOne({ username }).populate({
      path: "empID",
      populate: {
        path: "resID",
      },
    });

    const accessToken = jwt.sign(
      {
        userID: user._id.toString(),
        username: user.username,
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
        username: user.username,
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

    user.status = "Active";
    await user.save();

    return res.status(200).json({
      message: "Login successful!",
    });
  } catch (error) {
    console.error("Error in logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkCredentials = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).populate({
      path: "empID",
      populate: {
        path: "resID",
      },
    });
    if (!user || user.resID) {
      console.log("❌ Account not found");
      return res.status(404).json({
        message: "Account not found",
      });
    }
    if (user.status === "Deactivated") {
      console.log("❌ Account is deactivated");
      return res.status(403).json({
        message: "Account is deactivated",
      });
    }

    if (user.status === "Password Not Set") {
      rds.get(`userID_${user._id}`, (err, storedToken) => {
        if (err) {
          console.error("Error retrieving token from Redis:", err);
          return res.status(500).json({ message: "Failed to verify token" });
        }

        if (!storedToken) {
          return res
            .status(400)
            .json({ message: "Token has expired or does not exist" });
        }

        if (storedToken === password) {
          return res
            .status(200)
            .json({ message: "Token verified successfully!" });
        } else {
          return res.status(400).json({ message: "Invalid token" });
        }
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Incorrect Password");
      return res.status(403).json({
        message: "Incorrect password",
      });
    }
    return res.status(200).json({
      message: "Credentials verified",
    });
  } catch (error) {
    console.error("Error in checking credentials:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMobileNumber = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username: username }).populate({
      path: "empID",
      select: "resID",
      populate: {
        path: "resID",
        select: "mobilenumber",
      },
    });
    if (!user) {
      return res.status(404).json({ message: "Username not found!" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in sending OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { username, OTP } = req.body;

    console.log("Incoming verify request body:", req.body);

    rds.get(`username_${username}`, (err, storedOTP) => {
      if (err) {
        console.error("Error retrieving OTP from Redis:", err);
        return res.status(500).json({ message: "Failed to verify OTP" });
      }

      if (!storedOTP) {
        return res
          .status(400)
          .json({ message: "OTP has expired or does not exist" });
      }

      if (storedOTP === OTP.toString()) {
        return res.status(200).json({ message: "OTP verified successfully!" });
      } else {
        return res.status(400).json({ message: "Invalid OTP" });
      }
    });
  } catch (error) {
    console.error("Error in sending OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendOTP = async (req, res) => {
  try {
    const { username, mobilenumber } = req.body;
    const response = await axios.post("https://api.semaphore.co/api/v4/otp", {
      apikey: "46d791fbe4e880554fcad1ee958bbf33",
      number: mobilenumber,
      message:
        "Your one time password is {otp}. Please use it within 5 minutes.",
    });

    rds.setex(`username_${username}`, 300, response.data[0]?.code.toString());
    res.status(200).json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Error in sending OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });

    if (user) {
      return res.status(409).json({ message: "Username is already taken" });
    }
    return res.status(200).json({ message: "Username does not exist yet" });
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
