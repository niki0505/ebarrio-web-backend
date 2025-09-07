import Employee from "../models/Employees.js";
import Resident from "../models/Residents.js";
import ActivityLog from "../models/ActivityLogs.js";
import User from "../models/Users.js";
import Household from "../models/Households.js";
import axios from "axios";
import fetch from "node-fetch";
import { getPendingResidents } from "../utils/collectionUtils.js";

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

    const household = await Household.findById(resident.householdno);

    const isHead = household.members.some(
      (member) =>
        member.resID.toString() === resident._id.toString() &&
        member.position === "Head"
    );

    if (isHead) {
      household.status = "Rejected";
      await household.save();
    } else {
      household.members = household.members.filter(
        (member) => member.resID.toString() !== resident._id.toString()
      );
      household.status = "Active";
      await household.save();
    }

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

    await resident.save();

    const household = await Household.findById(resident.householdno);

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

        if (otherMembers) {
          await Promise.all(
            otherMembers.map(({ resID }) =>
              Resident.findByIdAndUpdate(resID, { householdno: household._id })
            )
          );
        }
      }
    }

    household.status = "Active";
    await household.save();

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

// export const issueDocument = async (req, res) => {
//   try {
//     const { resID } = req.params;
//     const { typeofcertificate } = req.body;
//     const { userID } = req.user;

//     const resident = await Resident.findById(resID);

//     await ActivityLog.insertOne({
//       userID: userID,
//       action: "Residents",
//       description: `User issued ${resident.lastname}, ${
//         resident.firstname
//       } a ${typeofcertificate.toLowerCase()}.`,
//     });

//     return res.status(200).json({
//       message: "Admin issued a document.",
//     });
//   } catch (error) {
//     console.error("Error in issuing a document:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// export const printBrgyID = async (req, res) => {
//   try {
//     const { resID } = req.params;
//     const { userID } = req.user;

//     const resident = await Resident.findById(resID);

//     await ActivityLog.insertOne({
//       userID: userID,
//       action: "Residents",
//       description: `User viewed the current barangay ID of ${resident.lastname}, ${resident.firstname}.`,
//     });

//     return res.status(200).json({
//       message: "Admin print the current barangay ID.",
//     });
//   } catch (error) {
//     console.error("Error in printing current barangay ID:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// export const viewResidentDetails = async (req, res) => {
//   try {
//     const { resID } = req.params;
//     const { userID, role } = req.user;

//     const resident = await Resident.findById(resID);

//     if (role !== "Technical Admin") {
//       await ActivityLog.insertOne({
//         userID: userID,
//         action: "Residents",
//         description: `User viewed the details of ${resident.lastname}, ${resident.firstname}.`,
//       });
//     }

//     return res.status(200).json(resident);
//   } catch (error) {
//     console.error("Error in recovering resident:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

export const recoverResident = async (req, res) => {
  try {
    const { resID } = req.params;
    const { userID, role } = req.user;
    const resident = await Resident.findById(resID);
    const existing = await Resident.findOne({
      firstname: resident.firstname,
      middlename: resident.middlename,
      lastname: resident.lastname,
      mobilenumber: resident.mobilenumber,
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
      // Check if resident is the household head
      const isHead = household.members.some(
        (member) =>
          member.resID._id.toString() === resident._id.toString() &&
          member.position === "Head"
      );

      if (isHead) {
        // Get all other active members
        const otherActiveMembers = household.members.filter(
          (member) => member.resID._id.toString() !== resident._id.toString()
        );

        if (otherActiveMembers.length === 0) {
          // No other members, archive household
          household.status = "Archived";
        } else {
          // Pick new head: prioritize legal age (>=18), then oldest
          let eligibleMembers = otherActiveMembers.filter(
            (m) => m.resID.age >= 18
          );
          if (eligibleMembers.length === 0)
            eligibleMembers = otherActiveMembers;

          const newHead = eligibleMembers.reduce((prev, curr) =>
            curr.resID.age > prev.resID.age ? curr : prev
          );

          // Update the position of the new head
          household.members = household.members.map((m) => {
            if (m.resID._id.toString() === newHead.resID._id.toString()) {
              return { ...m.toObject(), position: "Head" };
            }
            return m;
          });

          // Remove the archived resident from household members
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
