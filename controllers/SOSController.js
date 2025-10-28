import SOS from "../models/SOS.js";
import { getActiveSOS, getReportsUtils } from "../utils/collectionUtils.js";

export const getActiveSOSCount = async (req, res) => {
  try {
    const sos = await getActiveSOS();
    return res.status(200).json(sos);
  } catch (error) {
    console.error("Backend image error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await getReportsUtils();
    return res.status(200).json(reports);
  } catch (error) {
    console.error("Error getting SOS:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
