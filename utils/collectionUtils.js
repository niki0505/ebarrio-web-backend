import Certificate from "../models/Certificates.js";
import Announcement from "../models/Announcements.js";
import Resident from "../models/Residents.js";
import Employee from "../models/Employees.js";
import CourtReservation from "../models/CourtReservations.js";
import EmergencyHotline from "../models/EmergencyHotlines.js";
import User from "../models/Users.js";
import Blotter from "../models/Blotters.js";

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
        path: "empID",
        populate: {
          path: "resID",
        },
      })
      .populate("resID");
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
    const employees = await Employee.find().populate("resID");
    return employees;
  } catch (error) {
    throw new Error("Error fetching employees: " + error.message);
  }
};

export const getResidentsUtils = async () => {
  try {
    const residents = await Resident.find()
      .select("-empID")
      .populate("empID")
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
        select: "firstname middlename lastname",
      },
    });
    return announcements;
  } catch (error) {
    throw new Error("Error fetching announcements: " + error.message);
  }
};

export const getFormattedCertificates = async () => {
  try {
    const certificates = await Certificate.find().populate("resID");

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
    }));
  } catch (error) {
    throw new Error("Error fetching certificates: " + error.message);
  }
};
