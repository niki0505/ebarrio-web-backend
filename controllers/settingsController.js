import User from "../models/Users.js";
import bcrypt from "bcryptjs";

export const changeSecurityQuestions = async (req, res) => {
  try {
    const { userID } = req.params;
    const { securityquestions, password } = req.body;
    const user = await User.findById(userID);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    if (securityquestions[0]) {
      user.securityquestions[0] = securityquestions[0];
    }

    if (securityquestions[1]) {
      user.securityquestions[1] = securityquestions[1];
    }

    await user.save();

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
      return res.status(400).json({ message: "Incorrect current password" });
    }

    user.password = newpassword;
    await user.save();

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
      return res.status(400).json({ message: "Incorrect password" });
    }

    user.username = username;
    await user.save();

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
