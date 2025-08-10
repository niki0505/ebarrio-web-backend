import Certificate from "../models/Certificates.js";
import Announcement from "../models/Announcements.js";
import Resident from "../models/Residents.js";
import Employee from "../models/Employees.js";
import CourtReservation from "../models/CourtReservations.js";
import EmergencyHotline from "../models/EmergencyHotlines.js";
import User from "../models/Users.js";
import Blotter from "../models/Blotters.js";
import axios from "axios";
import Notification from "../models/Notifications.js";
import ActivityLog from "../models/ActivityLogs.js";
import Household from "../models/Households.js";

export const getPendingHouseholds = async () => {
  try {
    const house = await Household.countDocuments({
      status: { $in: ["Pending", "Change Requested"] },
    });
    return house;
  } catch (error) {
    throw new Error("Error fetching residents: " + error.message);
  }
};

export const getAllHouseholdUtils = async (req, res) => {
  try {
    const households = await Household.find().populate("members.resID");
    return households;
  } catch (error) {
    console.log("Error fetching households", error);
    res.status(500).json({ message: "Failed to fetch households" });
  }
};

export const getActivityLogs = async () => {
  try {
    const formatDatePH = (date) => {
      return new Date(date).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };
    const logs = await ActivityLog.find().populate({
      path: "userID",
      select: "username empID resID",
      populate: [
        {
          path: "empID",
          select: "position resID",
          populate: {
            path: "resID",
            select: "firstname lastname picture",
          },
        },
        {
          path: "resID",
          select: "firstname lastname picture",
        },
      ],
    });
    return logs.map((log) => ({
      ...log.toObject(),
      createdAt: formatDatePH(log.createdAt),
    }));
  } catch (error) {
    throw new Error("Error fetching activity logs: " + error.message);
  }
};

export const sendNotificationUpdate = async (userID, io) => {
  const notifications = await Notification.find({ userID });
  io.to(userID).emit("notificationUpdate", notifications);
};

export const sendPushNotification = async (pushtoken, title, body, screen) => {
  if (!pushtoken?.startsWith("ExponentPushToken")) {
    console.error("Invalid Expo push token:", pushtoken);
    return;
  }

  try {
    const response = await axios.post("https://exp.host/--/api/v2/push/send", {
      to: pushtoken,
      sound: "default",
      title,
      body,
      data: { screen: screen },
    });
    console.log("✅ Push notification sent! Response:", response.data);
  } catch (error) {
    console.error("❌ Failed to send push notification:", error.message);
  }
};

export const getPendingBlotters = async () => {
  try {
    const blot = await Blotter.countDocuments({ status: "Pending" });
    return blot;
  } catch (error) {
    throw new Error("Error fetching residents: " + error.message);
  }
};

export const getBlottersUtils = async () => {
  try {
    const blotters = await Blotter.find()
      .populate("complainantID", "firstname middlename lastname signature")
      .populate("subjectID", "firstname middlename lastname signature")
      .populate("witnessID", "firstname middlename lastname signature");

    const formatDatePH = (date) => {
      return new Date(date).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    return blotters.map((blot) => ({
      ...blot.toObject(),
      createdAt: formatDatePH(blot.createdAt),
      updatedAt: formatDatePH(blot.updatedAt),
      starttime: blot.starttime ? formatDatePH(blot.starttime) : null,
      endtime: blot.endtime ? formatDatePH(blot.endtime) : null,
    }));
  } catch (error) {
    throw new Error("Error fetching blotter reports: " + error.message);
  }
};

export const getUsersUtils = async () => {
  try {
    const users = await User.find()
      .populate({
        path: "resID",
        select: "firstname middlename lastname picture",
      })
      .populate({
        path: "empID",
        populate: {
          path: "resID",
          select: "firstname middlename lastname picture",
        },
      });
    const formatDatePH = (date) => {
      return new Date(date).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    return users.map((user) => ({
      ...user.toObject(),
      createdAt: formatDatePH(user.createdAt),
      updatedAt: formatDatePH(user.updatedAt),
    }));

    return users;
  } catch (error) {
    throw new Error("Error fetching users: " + error.message);
  }
};

export const getHotlinesUtils = async () => {
  try {
    const emergency = await EmergencyHotline.find();
    return emergency;
  } catch (error) {
    throw new Error("Error fetching emergency hotlines: " + error.message);
  }
};

export const getPendingReservations = async () => {
  try {
    const court = await CourtReservation.countDocuments({ status: "Pending" });
    return court;
  } catch (error) {
    throw new Error("Error fetching residents: " + error.message);
  }
};

export const getReservationsUtils = async () => {
  try {
    const reservation = await CourtReservation.find().populate("resID");
    return reservation;
  } catch (error) {
    throw new Error("Error fetching court reservations: " + error.message);
  }
};

export const getEmployeesUtils = async () => {
  try {
    const employees = await Employee.find().populate({
      path: "resID",
      populate: {
        path: "householdno",
        select: "address",
      },
    });
    return employees;
  } catch (error) {
    throw new Error("Error fetching employees: " + error.message);
  }
};

export const getPendingResidents = async () => {
  try {
    const residents = await Resident.countDocuments({ status: "Pending" });
    return residents;
  } catch (error) {
    throw new Error("Error fetching residents: " + error.message);
  }
};

export const getResidentsUtils = async () => {
  try {
    const residents = await Resident.find()
      .select("-empID")
      .populate("empID")
      .populate("householdno", "address")
      .exec();
    return residents;
  } catch (error) {
    throw new Error("Error fetching residents: " + error.message);
  }
};

export const getAnnouncementsUtils = async () => {
  try {
    const announcements = await Announcement.find().populate({
      path: "uploadedby",
      select: "position",
      populate: {
        path: "resID",
        select: "firstname middlename lastname picture",
      },
    });
    return announcements;
  } catch (error) {
    throw new Error("Error fetching announcements: " + error.message);
  }
};

export const getPendingDocuments = async () => {
  try {
    const cert = await Certificate.countDocuments({ status: "Pending" });
    return cert;
  } catch (error) {
    throw new Error("Error fetching residents: " + error.message);
  }
};

export const getFormattedCertificates = async () => {
  try {
    const certificates = await Certificate.find().populate({
      path: "resID",
      populate: {
        path: "householdno",
        select: "address",
      },
    });

    const formatDatePH = (date) => {
      return new Date(date).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    return certificates.map((cert) => ({
      ...cert.toObject(),
      createdAt: formatDatePH(cert.createdAt),
      updatedAt: formatDatePH(cert.updatedAt),
    }));
  } catch (error) {
    throw new Error("Error fetching certificates: " + error.message);
  }
};
