import User from "../models/Users.js";
import bcrypt from "bcryptjs";
import ActivityLog from "../models/ActivityLogs.js";
import { rds } from "../index.js";

export const changeSecurityQuestions = async (req, res) => {
  try {
    const { userID } = req.params;
    const { securityquestions, password } = req.body;
    const user = await User.findById(userID);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Hmm… that password didn’t work. Let’s try again." });
    }

    if (!Array.isArray(user.securityquestions)) {
      user.securityquestions = [];
    }

    for (let i = 0; i < 2; i++) {
      if (securityquestions[i]) {
        if (!user.securityquestions[i]) {
          user.securityquestions[i] = { question: "", answer: "" };
        }
        const isSame = await bcrypt.compare(
          securityquestions[i].answer,
          user.securityquestions[i].answer || ""
        );
        if (isSame) {
          return res.status(400).json({
            message: `Answer for question ${
              i + 1
            } cannot be the same as before.`,
          });
        }
        user.securityquestions[i].answer = securityquestions[i].answer;

        user.securityquestions[i].question = securityquestions[i].question;
      }
    }

    await user.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "Account Settings",
      description: `User updated their security questions.`,
    });

    res
      .status(200)
      .json({ message: "Security questions changed successfully!" });
  } catch (error) {
    console.log("Error changing security questions", error);
    res.status(500).json({ message: "Failed to change securityquestions" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userID } = req.params;
    const { newpassword, password } = req.body;
    const user = await User.findById(userID);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Hmm… that password didn’t work. Let’s try again." });
    }

    const isSame = await bcrypt.compare(newpassword, user.password);

    if (isSame) {
      return res.status(400).json({
        message:
          "Your new password must be different from your current password.",
      });
    }

    user.password = newpassword;
    user.passwordchangedat = new Date();
    await user.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "Account Settings",
      description: `User updated their password.`,
    });

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    console.log("Error changing password", error);
    res.status(500).json({ message: "Failed to change password" });
  }
};

export const changeUsername = async (req, res) => {
  try {
    const { userID } = req.params;
    const { username, password } = req.body;
    const user = await User.findById(userID);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Hmm… that password didn’t work. Let’s try again." });
    }

    const isSame = username === user.username;

    if (isSame) {
      return res.status(400).json({
        message:
          "Your new username must be different from your current username.",
      });
    }

    user.username = username;
    await user.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "Account Settings",
      description: `User updated their username.`,
    });

    await rds.setex(`limitUsernameChange_${userID}`, 2592000, "true");

    res.status(200).json({ message: "Username changed successfully!" });
  } catch (error) {
    console.log("Error changing username", error);
    res.status(500).json({ message: "Failed to change username" });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { userID } = req.params;
    const user = await User.findById(userID)
      .select("username role securityquestions empID")
      .populate({
        path: "empID",
        select: "resID",
        populate: { path: "resID" },
      });

    res.status(200).json(user);
  } catch (error) {
    console.log("Error fetching user", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};
