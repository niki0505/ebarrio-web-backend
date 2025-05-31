import ActivityLog from "../models/ActivityLogs.js";
import { getActivityLogs } from "../utils/collectionUtils.js";

export const getLogs = async (req, res) => {
  try {
    const logs = await getActivityLogs();
    return res.status(200).json(logs);
  } catch (error) {
    console.error("Error in fetching activity logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
