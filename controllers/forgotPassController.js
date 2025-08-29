import User from "../models/Users.js";
import { getAllUsers } from "./userController.js";
import bcrypt from "bcryptjs";
import { rds } from "../index.js";
import ActivityLog from "../models/ActivityLogs.js";

export const checkOTP = async (req, res) => {
  try {
    const { username } = req.params;

    const exists = await rds.exists(`disabledOTP_${username}`);

    if (exists) {
      return res.status(429).json({ message: "OTP is temporarily disabled." });
    } else {
      return res.status(200).json({ message: "User can use OTP" });
    }
  } catch (error) {
    console.log("Error checking OTP use", error);
    res.status(500).json({ message: "Failed to check OTP use" });
  }
};

export const limitOTP = async (req, res) => {
  try {
    const { username } = req.params;

    rds.setex(`disabledOTP_${username}`, 1800, "true");

    res.status(200).json({ message: "User cannot use OTP for the mean time" });
  } catch (error) {
    console.log("Error limiting OTP use", error);
    res.status(500).json({ message: "Failed to limit OTP use" });
  }
};

export const newPassword = async (req, res) => {
  try {
    const { username } = req.params;
    const { newPassword } = req.body;
    const user = await User.findOne({ username: username });

    user.password = newPassword;
    user.passwordchangedat = new Date();
    await user.save();

    await ActivityLog.insertOne({
      userID: user._id,
      action: "Forgot Password",
      description: `User has completed password reset process.`,
    });

    res.status(200).json({ message: "Password successfully changed" });
  } catch (error) {
    console.log("Error setting new password", error);
    res.status(500).json({ message: "Failed to set new password" });
  }
};

export const verifySecurityQuestion = async (req, res) => {
  try {
    const { username } = req.params;
    const { securityquestion } = req.body;
    const user = await User.findOne({ username: username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.securityquestions || user.securityquestions.length === 0) {
      return res.status(400).json({ message: "No security questions found." });
    }

    const question = user.securityquestions.find(
      (q) => q.question === securityquestion.question
    );

    const isMatch = await bcrypt.compare(
      securityquestion.answer.trim().toLowerCase(),
      question.answer
    );

    if (isMatch) {
      res.status(200).json({ message: "Security question is verified" });
    } else {
      return res.status(400).json({
        message: "We couldn’t verify your answer. Please check and try again.",
      });
    }
  } catch (error) {
    console.log("Error verifying security question", error);
    res.status(500).json({ message: "Failed to verify security question" });
  }
};

export const checkUser = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username })
      .select("securityquestions status role mobilenumber")
      .populate({
        path: "empID",
        select: "resID",
        populate: {
          path: "resID",
          select: "mobilenumber",
        },
      });

    if (
      !user ||
      user.resID ||
      user.role === "Official" ||
      user.role === "Resident" ||
      user.status === "Archived" ||
      user.status === "Password Not Set"
    ) {
      console.log("❌ Account not found");
      return res.status(404).json({
        message: "No account found. Please check your credentials.",
      });
    }
    if (user.status === "Deactivated") {
      console.log("❌ Account is deactivated");
      return res.status(403).json({
        message: "Account is currently deactivated.",
      });
    }

    if (user.status === "Password Not Set") {
      return res.status(403).json({
        message: "Account password has not been set.",
      });
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found. Please check your credentials." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Error checking user", error);
    res.status(500).json({ message: "Failed to check user" });
  }
};
