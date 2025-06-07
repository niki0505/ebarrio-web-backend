import Household from "../models/Households.js";

export const getHousehold = async (req, res) => {
  try {
    const { householdID } = req.params;
    const household = await Household.findById(householdID).populate(
      "members.resID"
    );
    res.status(200).json(household);
  } catch (error) {
    console.log("Error fetching household", error);
    res.status(500).json({ message: "Failed to fetch household" });
  }
};

export const getAllHousehold = async (req, res) => {
  try {
    const households = await Household.find().populate("members.resID");
    res.status(200).json(households);
  } catch (error) {
    console.log("Error fetching households", error);
    res.status(500).json({ message: "Failed to fetch households" });
  }
};
