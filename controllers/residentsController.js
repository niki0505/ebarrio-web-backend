import Employee from "../models/Employees.js";
import Resident from "../models/Residents.js";
import ActivityLog from "../models/ActivityLogs.js";
import User from "../models/Users.js";
import Household from "../models/Households.js";
import ChangeResident from "../models/ChangeResident.js";
import axios from "axios";
import fetch from "node-fetch";
import { getPendingResidents } from "../utils/collectionUtils.js";

export const rejectResidentChange = async (req, res) => {
  try {
    const { resID, changeID } = req.params;

    const resident = await Resident.findById(resID).populate("householdno");
    const updated = await ChangeResident.findById(changeID);

    if (!resident || !updated) {
      return res.status(404).json({ message: "Resident or change not found" });
    }

    const oldHouse = await Household.findById(resident.householdno);
    const newHouse = await Household.findById(updated.householdno);

    if (!oldHouse || !newHouse) {
      return res
        .status(404)
        .json({ message: "Old or new household not found" });
    }

    resident.status = "Active";
    resident.changeID = undefined;

    await resident.save();

    await ChangeResident.findByIdAndDelete(changeID);

    return res.status(200).json({
      message: "Resident change successfully rejected.",
    });
  } catch (error) {
    console.error("Error in approving resident change:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const approveResidentChange = async (req, res) => {
  try {
    const { resID, changeID } = req.params;

    const resident = await Resident.findById(resID).populate("householdno");
    const updated = await ChangeResident.findById(changeID);

    if (!resident || !updated) {
      return res.status(404).json({ message: "Resident or change not found" });
    }

    const oldHouse = await Household.findById(resident.householdno);
    const newHouse = await Household.findById(updated.householdno);

    if (!oldHouse || !newHouse) {
      return res
        .status(404)
        .json({ message: "Old or new household not found" });
    }

    // Check if resident is Head in old household
    const isHead = oldHouse.members.some(
      (mem) =>
        mem.resID.toString() === resident._id.toString() &&
        mem.position === "Head"
    );

    // Check if householdno changed (resident moved)
    const residentHouseholdId = resident.householdno?._id
      ? resident.householdno._id.toString()
      : resident.householdno.toString();

    // Normalize updated.householdno
    const updatedHouseholdId = updated.householdno?._id
      ? updated.householdno._id.toString()
      : updated.householdno.toString();

    const movedToOtherHouse = updatedHouseholdId !== residentHouseholdId;

    if (updated.head === "Yes") {
      const newhousehold = await Household.findById(updated.householdno);
      newhousehold.status = "Active";
      await newhousehold.save();
      resident.householdno = newhousehold._id;
      resident.changeID = undefined;
      oldHouse.members = oldHouse.members.filter(
        (mem) => mem.resID.toString() !== resident._id.toString()
      );

      for (const mem of newHouse.members) {
        const memberResident = await Resident.findById(mem.resID);
        if (
          memberResident.householdno &&
          memberResident.householdno.toString() !== newHouse._id.toString()
        ) {
          const oldMemHouse = await Household.findById(
            memberResident.householdno
          ).populate("members.resID");

          if (oldMemHouse) {
            // If they were Head in their old household → elect new Head
            const wasHead = oldMemHouse.members.some(
              (m) =>
                m.resID._id.toString() === memberResident._id.toString() &&
                m.position === "Head"
            );

            if (wasHead) {
              // Exclude the leaving member from eligible members
              let eligibleMembers = oldMemHouse.members.filter(
                (m) =>
                  m.resID._id.toString() !== memberResident._id.toString() &&
                  m.resID.age >= 18
              );

              // If none eligible by age, pick anyone except leaving member
              if (!eligibleMembers.length) {
                eligibleMembers = oldMemHouse.members.filter(
                  (m) =>
                    m.resID._id.toString() !== memberResident._id.toString()
                );
              }

              if (eligibleMembers.length) {
                // Pick the oldest eligible member as new head
                const newHead = eligibleMembers.reduce((prev, curr) =>
                  curr.resID.age > prev.resID.age ? curr : prev
                );

                // Assign new head & remove leaving member
                oldMemHouse.members = oldMemHouse.members
                  .filter(
                    (m) =>
                      m.resID._id.toString() !== memberResident._id.toString()
                  )
                  .map((m) =>
                    m.resID._id.toString() === newHead.resID._id.toString()
                      ? { ...m, position: "Head" }
                      : m
                  );
              } else {
                // No members left → archive the household
                oldMemHouse.status = "Archived";
              }
            } else {
              // If not head, just remove the leaving member
              oldMemHouse.members = oldMemHouse.members.filter(
                (m) => m.resID._id.toString() !== memberResident._id.toString()
              );
            }

            await oldMemHouse.save();
          }

          // Update their householdno
          memberResident.householdno = newHouse._id;
          await memberResident.save();
        }
      }
    } else {
      if (isHead && movedToOtherHouse) {
        // --- Handle old household ---
        const otherActiveMembers = oldHouse.members.filter(
          (mem) => mem.resID.toString() !== resident._id.toString()
        );

        let eligibleMembers = otherActiveMembers.filter(
          (mem) => mem.resID.age >= 18
        );

        if (!eligibleMembers.length) eligibleMembers = otherActiveMembers;

        if (eligibleMembers.length) {
          // Pick oldest as new Head
          const newHead = eligibleMembers.reduce((prev, curr) =>
            curr.resID.age > prev.resID.age ? curr : prev
          );

          oldHouse.members = oldHouse.members.map((mem) => {
            if (mem.resID.toString() === newHead.resID.toString()) {
              return { ...mem, position: "Head" };
            }
            return mem;
          });

          oldHouse.members = oldHouse.members.filter(
            (mem) => mem.resID.toString() !== resident._id.toString()
          );
        } else {
          // No eligible members → archive household

          oldHouse.status = "Archived";
        }
        newHouse.members.push({
          resID: resident._id,
          position: updated.householdposition,
        });
      } else if (!isHead && movedToOtherHouse) {
        // Remove from old household
        oldHouse.members = oldHouse.members.filter(
          (mem) => mem.resID.toString() !== resident._id.toString()
        );

        // Add to new household
        newHouse.members.push({
          resID: resident._id,
          position: updated.householdposition,
        });
      } else if (!isHead && !movedToOtherHouse) {
        // 🟢 Case C: Same household, only position changes
        oldHouse.members.forEach((mem) => {
          if (mem.resID.toString() === resident._id.toString()) {
            mem.position = updated.householdposition;
          }
        });
      }
      await newHouse.save();
    }

    resident.householdno = updated.householdno;
    resident.status = "Active";
    resident.changeID = undefined;

    await oldHouse.save();
    await resident.save();

    // --- Delete approved change record ---
    await ChangeResident.findByIdAndDelete(changeID);

    return res.status(200).json({
      message: "Resident change successfully approved.",
    });
  } catch (error) {
    console.error("Error in approving resident change:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getResidentChange = async (req, res) => {
  try {
    const { changeID } = req.params;
    const resident = await ChangeResident.findById(changeID).populate(
      "householdno",
      "address"
    );
    return res.status(200).json(resident);
  } catch (error) {
    console.error("Error in fetching resident change:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPendingResidentsCount = async (req, res) => {
  try {
    const residents = await getPendingResidents();
    return res.status(200).json(residents);
  } catch (error) {
    console.error("Backend image error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getResidentImages = async (req, res) => {
  try {
    const { resID } = req.params;
    const resident = await Resident.findById(resID);

    if (!resident)
      return res.status(404).json({ message: "Resident not found" });

    const fetchImageAsBase64 = async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");

        const contentType = response.headers.get("content-type") || "image/png"; // fallback
        const buffer = await response.buffer();
        const base64 = buffer.toString("base64");

        return {
          mime: contentType,
          base64,
        };
      } catch (err) {
        console.error("Image fetch error:", err);
        return null;
      }
    };

    const picture = await fetchImageAsBase64(resident.picture);
    const signature = await fetchImageAsBase64(resident.signature);

    if (!picture || !signature) {
      return res
        .status(500)
        .json({ message: "Failed to fetch one or more images" });
    }

    return res.status(200).json({
      picture: `data:${picture.mime};base64,${picture.base64}`,
      signature: `data:${signature.mime};base64,${signature.base64}`,
    });
  } catch (error) {
    console.error("Backend image error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectResident = async (req, res) => {
  try {
    const { resID } = req.params;
    const { remarks } = req.body;
    const { userID, role } = req.user;

    const resident = await Resident.findById(resID);

    resident.status = "Rejected";

    await resident.save();

    if (role !== "Technical Admin") {
      await ActivityLog.insertOne({
        userID,
        action: "Reject",
        target: "Residents",
        description: `User rejected ${resident.lastname}, ${resident.firstname}`,
      });
    }

    await axios.post("https://api.semaphore.co/api/v4/priority", {
      apikey: process.env.SEMAPHORE_KEY,
      number: resident.mobilenumber,
      message: `We regret to inform you that your resident profile request has been rejected. Reason: ${remarks}. If you have questions or believe this was a mistake, please contact the barangay office for assistance. Thank you.`,
    });

    return res.status(200).json({
      message: "Admin rejected a resident profile.",
    });
  } catch (error) {
    console.error("Error in rejecting a resident profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const approveResident = async (req, res) => {
  try {
    const { resID } = req.params;
    const { pictureURL } = req.body;
    const { userID, role } = req.user;

    const resident = await Resident.findById(resID);

    resident.status = "Active";
    resident.picture = pictureURL;

    const household = await Household.findById(resident.householdno);

    if (household) {
      const isHead = household.members.some(
        (member) =>
          member.resID.toString() === resident._id.toString() &&
          member.position === "Head"
      );

      if (isHead) {
        if (Array.isArray(household.members)) {
          const otherMembers = household.members.filter(
            (member) =>
              member.resID.toString() !== resident._id.toString() &&
              member.position !== "Head"
          );

          if (otherMembers.length) {
            await Promise.all(
              otherMembers.map(({ resID }) =>
                Resident.findByIdAndUpdate(resID, {
                  householdno: household._id,
                })
              )
            );
          }
        }
      } else {
        household.members.push({
          resID: resident._id,
          position: resident.householdposition,
        });
        resident.householdposition = undefined;
      }

      household.status = "Active";
      await household.save();
    }
    await resident.save();

    if (role !== "Technical Admin") {
      await ActivityLog.insertOne({
        userID,
        action: "Approve",
        target: "Residents",
        description: `User approved ${resident.lastname}, ${resident.firstname}`,
      });
    }

    await axios.post("https://api.semaphore.co/api/v4/priority", {
      apikey: process.env.SEMAPHORE_KEY,
      number: resident.mobilenumber,
      message: `Your resident profile has been approved by Barangay Aniban 2. You may now create an account on the mobile application. Thank you!`,
    });

    return res.status(200).json({
      message: "Admin approved a resident profile.",
    });
  } catch (error) {
    console.error("Error in approving a resident profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const recoverResident = async (req, res) => {
  try {
    const { resID } = req.params;
    const { userID, role } = req.user;
    const resident = await Resident.findById(resID);
    const existing = await Resident.findOne({
      firstname: resident.firstname,
      middlename: resident.middlename,
      lastname: resident.lastname,
      status: { $ne: "Archived" },
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "This person is already an active resident." });
    }
    if (!resident) {
      return res.status(404).json({ message: "Resident not found." });
    }

    if (resident.userID) {
      const user = await User.findById(resident.userID);

      if (!user.passwordistoken) {
        user.status = "Inactive";
      } else {
        user.status = "Password Not Set";
      }

      await user.save();
    }

    resident.status = "Active";
    await resident.save();

    if (role !== "Technical Admin") {
      await ActivityLog.insertOne({
        userID,
        action: "Recover",
        target: "Residents",
        description: `User recovered the resident profile of ${resident.lastname}, ${resident.firstname}.`,
      });
    }

    return res.status(200).json({
      message: "Resident has been successfully recovered.",
    });
  } catch (error) {
    console.error("Error in recovering resident:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const archiveResident = async (req, res) => {
  try {
    const { resID } = req.params;
    const { userID, role } = req.user;

    const resident = await Resident.findById(resID);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found." });
    }

    const household = await Household.findById(resident.householdno).populate(
      "members.resID",
      "age"
    );

    if (household) {
      const isHead = household.members.some(
        (member) =>
          member.resID._id.toString() === resident._id.toString() &&
          member.position === "Head"
      );

      if (isHead) {
        const otherActiveMembers = household.members.filter(
          (member) => member.resID._id.toString() !== resident._id.toString()
        );

        if (otherActiveMembers.length === 0) {
          household.status = "Archived";
        } else {
          let eligibleMembers = otherActiveMembers.filter(
            (m) => m.resID.age >= 18
          );
          if (eligibleMembers.length === 0)
            eligibleMembers = otherActiveMembers;

          const newHead = eligibleMembers.reduce((prev, curr) =>
            curr.resID.age > prev.resID.age ? curr : prev
          );

          household.members = household.members.map((m) => {
            if (m.resID._id.toString() === newHead.resID._id.toString()) {
              return { ...m.toObject(), position: "Head" };
            }
            return m;
          });

          household.members = household.members.filter(
            (m) => m.resID._id.toString() !== resident._id.toString()
          );
        }

        await household.save();
      } else {
        household.members = household.members.filter(
          (m) => m.resID._id.toString() !== resident._id.toString()
        );
        await household.save();
      }
    }

    if (resident.userID) {
      const user = await User.findById(resident.userID);
      user.status = "Archived";
      await user.save();
    }

    if (resident.empID) {
      const emp = await Employee.findById(resident.empID);
      emp.status = "Archived";
      emp.set("employeeID", undefined);
      await emp.save();
      if (emp.userID) {
        const user = await User.findById(emp.userID);
        user.status = "Archived";
        await user.save();
      }
      resident.set("empID", undefined);
    }

    resident.set("brgyID", undefined);
    resident.set("householdno", undefined);
    resident.status = "Archived";
    await resident.save();

    if (role !== "Technical Admin") {
      await ActivityLog.insertOne({
        userID,
        action: "Archive",
        target: "Residents",
        description: `User archived the resident profile of ${resident.lastname}, ${resident.firstname}.`,
      });
    }

    return res.status(200).json({
      message: "Resident has been successfully archived.",
    });
  } catch (error) {
    console.error("Error in archiving resident:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
