import Household from "../models/Households.js";
import Resident from "../models/Residents.js";

export const removeMember = async (req, res) => {
  try {
    const { householdID, memberID } = req.params;
    const household = await Household.findById(householdID);

    const member = household.members.find((m) => m._id.toString() === memberID);

    household.members = household.members.filter(
      (m) => m._id.toString() !== memberID
    );

    await household.save();

    const resident = await Resident.findById(member.resID);

    resident.set("householdno", undefined);
    await resident.save();

    res.status(200).json({ message: "Member successfully removed" });
  } catch (error) {
    console.log("Error updating household position", error);
    res.status(500).json({ message: "Failed to fetch household position" });
  }
};

export const addVehicle = async (req, res) => {
  try {
    const { householdID } = req.params;
    const payload = req.body;
    const household = await Household.findById(householdID);

    household.vehicles.push(payload);
    await household.save();

    res.status(200).json({ message: "Vehicle has been added successfully." });
  } catch (error) {
    console.log("Error updating household position", error);
    res.status(500).json({ message: "Failed to fetch household position" });
  }
};

export const addMember = async (req, res) => {
  try {
    const { householdID } = req.params;
    const payload = req.body;
    const household = await Household.findById(householdID);

    household.members.push(payload);
    await household.save();

    const resident = await Resident.findById(payload.resID);

    resident.householdno = household._id;
    await resident.save();

    const updated = await Household.findById(householdID).populate(
      "members.resID"
    );

    const addedMember = updated.members[updated.members.length - 1];

    res.status(200).json(addedMember);
  } catch (error) {
    console.log("Error updating household position", error);
    res.status(500).json({ message: "Failed to fetch household position" });
  }
};

export const editVehicle = async (req, res) => {
  try {
    const { householdID, vehicleID } = req.params;
    const { payload } = req.body;
    const household = await Household.findById(householdID);

    const vehicle = household.vehicles.find(
      (v) => v._id.toString() === vehicleID
    );

    vehicle.model = payload.model;
    vehicle.color = payload.color;
    vehicle.kind = payload.kind;
    vehicle.platenumber = payload.platenumber;

    await household.save();
    res.status(200).json({ message: "Vehicle successfully updated" });
  } catch (error) {
    console.log("Error updating vehicle", error);
    res.status(500).json({ message: "Failed to fetch household position" });
  }
};

export const editPosition = async (req, res) => {
  try {
    const { householdID, memberID } = req.params;
    const { position } = req.body;
    const household = await Household.findById(householdID);

    const member = household.members.find((m) => m._id.toString() === memberID);

    member.position = position;
    await household.save();
    res.status(200).json({ message: "Position successfully updated" });
  } catch (error) {
    console.log("Error updating household position", error);
    res.status(500).json({ message: "Failed to fetch household position" });
  }
};

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
