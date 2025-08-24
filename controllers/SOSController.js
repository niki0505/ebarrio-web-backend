import SOS from "../models/SOS.js";
import { getReportsUtils } from "../utils/collectionUtils.js";

export const getReports = async (req, res) => {
  try {
    const reports = await getReportsUtils();
    return res.status(200).json(reports);
  } catch (error) {
    console.error("Error getting SOS:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
