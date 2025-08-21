import SOS from "../models/SOS.js";

export const getReports = async (req, res) => {
  try {
    const reports = await SOS.find().populate({
      path: "resID",
      select: "firstname lastname age mobilenumber picture householdno",
      populate: {
        path: "householdno",
        select: "address",
      },
    });

    return res.status(200).json(reports);
  } catch (error) {
    console.error("Error getting SOS:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
