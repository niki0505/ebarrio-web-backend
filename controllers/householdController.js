import ChangeHousehold from "../models/ChangeHouseholds.js";
import Household from "../models/Households.js";
import Resident from "../models/Residents.js";
import {
  getAllHouseholdUtils,
  getPendingHouseholds,
} from "../utils/collectionUtils.js";

// Helper to merge vehicles safely (avoid duplicate plate numbers)
const mergeVehicles = (currentVehicles, changeVehicles) => {
  const existingPlates = currentVehicles.map((v) => v.platenumber);
  const merged = [...currentVehicles];

  changeVehicles.forEach((v) => {
    if (!existingPlates.includes(v.platenumber)) {
      merged.push(v);
    }
  });

  return merged;
};

export const approveHouseholdChange = async (req, res) => {
  try {
    const { householdID, changeID } = req.params;

    const currentHouse = await Household.findById(householdID);
    const changeHouse = await ChangeHousehold.findById(changeID);

    if (!currentHouse || !changeHouse) {
      return res
        .status(404)
        .json({ message: "Household or change not found." });
    }

    // Merge members safely
    for (let m of changeHouse.members) {
      const resident = await Resident.findById(m.resID);
      if (!resident) continue;

      // If resident is in another household, remove them from there
      if (
        resident.householdno &&
        resident.householdno.toString() !== householdID
      ) {
        const oldHouse = await Household.findById(resident.householdno);
        if (oldHouse) {
          // Check if resident was head
          const wasHead = oldHouse.members.find(
            (mem) =>
              mem.resID.toString() === resident._id.toString() &&
              mem.position === "Head"
          );

          // Remove resident from old household
          oldHouse.members = oldHouse.members.filter(
            (mem) => mem.resID.toString() !== resident._id.toString()
          );

          // If removed resident was head, assign new head
          if (wasHead) {
            const otherActiveMembers = oldHouse.members.filter(
              (mem) => mem.resID
            );

            let eligibleMembers = otherActiveMembers.filter(
              (mem) => mem.resID.age >= 18
            );
            if (!eligibleMembers.length) eligibleMembers = otherActiveMembers;

            if (eligibleMembers.length) {
              const newHead = eligibleMembers.reduce((prev, curr) =>
                curr.resID.age > prev.resID.age ? curr : prev
              );
              oldHouse.members = oldHouse.members.map((mem) => {
                if (mem.resID.toString() === newHead.resID.toString()) {
                  return { ...mem, position: "Head" };
                }
                return mem;
              });
            } else {
              // No eligible members, archive household
              oldHouse.members.push({
                resID: resident._id,
                position: "Head",
              });

              oldHouse.status = "Archived";
            }
          }

          await oldHouse.save();
        }
      }

      // Update resident's household to currentHouse
      resident.householdno = householdID;
      await resident.save();

      // Add or update in currentHouse members
      const existingIndex = currentHouse.members.findIndex(
        (cm) => cm.resID.toString() === resident._id.toString()
      );
      if (existingIndex === -1) {
        currentHouse.members.push(m);
      } else {
        currentHouse.members[existingIndex].position = m.position;
      }
    }

    // Merge vehicles
    currentHouse.vehicles = mergeVehicles(
      currentHouse.vehicles,
      changeHouse.vehicles
    );

    // Merge other fields
    const fieldsToMerge = [
      "ethnicity",
      "tribe",
      "sociostatus",
      "nhtsno",
      "watersource",
      "toiletfacility",
      "address",
    ];

    fieldsToMerge.forEach((field) => {
      if (changeHouse[field] !== undefined) {
        currentHouse[field] = changeHouse[field];
      }
    });

    // Update status and remove applied change
    currentHouse.status = "Active";
    currentHouse.change = currentHouse.change.filter(
      (c) => c.changeID.toString() !== changeID
    );

    await currentHouse.save();
    await ChangeHousehold.findByIdAndDelete(changeID);

    const populatedCurrentHouse = await currentHouse.populate("members.resID");

    return res.status(200).json({
      message: "Household change successfully approved.",
      household: populatedCurrentHouse,
    });
  } catch (error) {
    console.error("Error in approving household change:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getHouseholdChange = async (req, res) => {
  try {
    const { changeID } = req.params;
    const house = await ChangeHousehold.findById(changeID).populate({
      path: "members.resID",
    });

    return res.status(200).json(house);
  } catch (error) {
    console.error("Error in fetching household change:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPendingHouseholdsCount = async (req, res) => {
  try {
    const house = await getPendingHouseholds();

    return res.status(200).json(house);
  } catch (error) {
    console.error("Error in fetching court reservations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeVehicle = async (req, res) => {
  try {
    const { householdID, vehicleID } = req.params;
    const household = await Household.findById(householdID);

    const vehicle = household.vehicles.find(
      (v) => v._id.toString() === vehicleID
    );

    household.vehicles = household.vehicles.filter(
      (v) => v._id.toString() !== vehicleID
    );

    await household.save();

    res.status(200).json({ message: "Vehicle successfully removed" });
  } catch (error) {
    console.log("Error updating household position", error);
    res.status(500).json({ message: "Failed to fetch household position" });
  }
};

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

    const addedVehicle = household.vehicles[household.vehicles.length - 1];

    res.status(200).json(addedVehicle);
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
    const households = await getAllHouseholdUtils();
    res.status(200).json(households);
  } catch (error) {
    console.log("Error fetching households", error);
    res.status(500).json({ message: "Failed to fetch households" });
  }
};
