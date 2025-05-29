import EmergencyHotline from "../models/EmergencyHotlines.js";
import { getHotlinesUtils } from "../utils/collectionUtils.js";
import ActivityLog from "../models/ActivityLogs.js";

export const recoverEmergencyHotlines = async (req, res) => {
  try {
    const { userID } = req.user;
    const { emergencyID } = req.params;

    const emergency = await EmergencyHotline.findById(emergencyID);

    if (!emergency) {
      return res.status(404).json({ message: "Emergency hotline not found." });
    }

    const existingName = await EmergencyHotline.findOne({
      name: emergency.name,
      status: { $in: "Active" },
    });
    const existingContact = await EmergencyHotline.findOne({
      contactnumber: emergency.contactnumber,
      _id: { $ne: emergencyID },
      status: { $in: "Active" },
    });

    if (existingContact && existingName) {
      return res.status(409).json({
        message:
          "An active emergency hotline with the same name and contact number already exists.",
      });
    }

    if (existingName) {
      return res.status(409).json({
        message: "An active emergency hotline with this name already exists.",
      });
    }

    if (existingContact) {
      return res.status(409).json({
        message:
          "An active emergency hotline with this contact number already exists.",
      });
    }

    emergency.status = "Active";

    await emergency.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "Emergency Hotlines",
      description: `User recovered ${emergency.name}'s contact details.`,
    });

    return res.status(200).json({
      message: "Emergency hotline has been successfully recovered.",
    });
  } catch (error) {
    console.error("Error in recovering emergency hotlines:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const archiveEmergencyHotlines = async (req, res) => {
  try {
    const { userID } = req.user;
    const { emergencyID } = req.params;

    const emergency = await EmergencyHotline.findById(emergencyID);

    if (!emergency) {
      return res.status(404).json({ message: "Emergency hotline not found." });
    }

    emergency.status = "Archived";

    await emergency.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "Emergency Hotlines",
      description: `User archived ${emergency.name}'s contact details.`,
    });

    return res.status(200).json({
      message: "Emergency hotline has been successfully archived.",
    });
  } catch (error) {
    console.error("Error in archiving emergency hotlines:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editEmergencyHotlines = async (req, res) => {
  try {
    const { userID } = req.user;
    const { name, contactNumber } = req.body;
    const { emergencyID } = req.params;

    const existingName = await EmergencyHotline.findOne({
      name: name,
      _id: { $ne: emergencyID },
      status: { $ne: "Archived" },
    });
    const existingContact = await EmergencyHotline.findOne({
      contactnumber: contactNumber,
      _id: { $ne: emergencyID },
      status: { $ne: "Archived" },
    });

    if (existingContact && existingName) {
      return res.status(409).json({
        message: "Both the hotline name and contact number already exist.",
      });
    }

    if (existingName) {
      return res.status(409).json({
        message: "The name you entered already exists.",
      });
    }

    if (existingContact) {
      return res.status(409).json({
        message: "The contact number you entered already exists.",
      });
    }

    const emergency = await EmergencyHotline.findById(emergencyID);

    emergency.name = name;
    emergency.contactnumber = contactNumber;

    await emergency.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "Emergency Hotlines",
      description: `User updated ${emergency.name}'s contact details.`,
    });

    return res.status(200).json({
      message: "Emergency hotlines is updated successfully",
    });
  } catch (error) {
    console.error("Error in updating emergency hotlines:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getEmergencyHotlines = async (req, res) => {
  try {
    const emergency = await getHotlinesUtils();
    return res.status(200).json(emergency);
  } catch (error) {
    console.error("Error in fetching emergency hotlines:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createEmergencyHotlines = async (req, res) => {
  try {
    const { userID } = req.user;
    const { name, contactNumber } = req.body;

    const existingName = await EmergencyHotline.findOne({
      name: name,
      status: { $ne: "Archived" },
    });
    const existingContact = await EmergencyHotline.findOne({
      contactnumber: contactNumber,
      status: { $ne: "Archived" },
    });

    if (existingContact && existingName) {
      return res.status(409).json({
        message: "Both the hotline name and contact number already exist.",
      });
    }

    if (existingName) {
      return res.status(409).json({
        message: "The name you entered already exists.",
      });
    }

    if (existingContact) {
      return res.status(409).json({
        message: "The contact number you entered already exists.",
      });
    }

    const emergency = new EmergencyHotline({
      name,
      contactnumber: contactNumber,
    });

    await emergency.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "Emergency Hotlines",
      description: `User added ${emergency.name}'s contact details.`,
    });

    return res.status(200).json({
      message: "Emergency hotlines is created successfully",
    });
  } catch (error) {
    console.error("Error in creating emergency hotlines:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
