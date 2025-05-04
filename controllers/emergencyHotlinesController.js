import EmergencyHotline from "../models/EmergencyHotlines.js";
import OldEmergencyHotline from "../models/OldEmergencyHotlines.js";
import mongoose from "mongoose";
import { getHotlinesUtils } from "../utils/collectionUtils.js";

export const archiveEmergencyHotlines = async (req, res) => {
  try {
    const { emergencyID } = req.params;

    const emergency = await EmergencyHotline.findById(emergencyID);

    const archivedEmergency = new OldEmergencyHotline({
      ...emergency.toObject(),
      archivedAt: new Date(),
    });

    await archivedEmergency.save();

    await EmergencyHotline.findByIdAndDelete(emergencyID);

    return res.status(200).json({
      message: "Emergency hotlines is archived successfully",
    });
  } catch (error) {
    console.error("Error in archiving emergency hotlines:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editEmergencyHotlines = async (req, res) => {
  try {
    const { name, contactNumber } = req.body;
    const { emergencyID } = req.params;

    const emergency = await EmergencyHotline.findById(emergencyID);

    emergency.name = name;
    emergency.contactnumber = contactNumber;

    await emergency.save();

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
    const { name, contactNumber } = req.body;

    const emergency = new EmergencyHotline({
      name,
      contactnumber: contactNumber,
    });

    await emergency.save();

    return res.status(200).json({
      message: "Emergency hotlines is created successfully",
    });
  } catch (error) {
    console.error("Error in creating emergency hotlines:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
