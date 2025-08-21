import CourtReservation from "../models/CourtReservations.js";
import {
  getPendingReservations,
  getReservationsUtils,
} from "../utils/collectionUtils.js";
import { sendPushNotification } from "../utils/collectionUtils.js";
import Notification from "../models/Notifications.js";
import { sendNotificationUpdate } from "../utils/collectionUtils.js";
import User from "../models/Users.js";
import Resident from "../models/Residents.js";

export const rejectCourtReq = async (req, res) => {
  try {
    const { reservationID } = req.params;
    const { remarks } = req.body;

    const court = await CourtReservation.findById(reservationID);
    if (!court) {
      return res.status(404).json({ message: "Court reservation not found" });
    }

    court.remarks = remarks;
    court.status = "Rejected";
    await court.save();

    const resident = await Resident.findById(court.resID).select("userID");

    const startTime = new Date(court.starttime);
    const endTime = new Date(court.endtime);

    const dateOptions = { year: "numeric", month: "short", day: "numeric" };
    const timeOptions = { hour: "numeric", minute: "numeric", hour12: true };

    const formattedDate = startTime.toLocaleDateString("en-US", dateOptions);
    const formattedStartTime = startTime.toLocaleTimeString(
      "en-US",
      timeOptions
    );

    const formattedEndTime = endTime.toLocaleTimeString("en-US", timeOptions);

    if (resident.userID) {
      const user = await User.findById(resident.userID);
      const io = req.app.get("socketio");
      io.to(user._id.toString()).emit("reservationUpdate", {
        title: `❌ Court Reservation Request Rejected`,
        message: `Your court reservation request scheduled on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime} has been rejected. Kindly see the remarks for the reason. `,
        timestamp: court.updatedAt,
      });

      if (user?.pushtoken) {
        await sendPushNotification(
          user.pushtoken,
          `❌ Court Reservation Request Rejected`,
          `Your court reservation request scheduled on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime} has been rejected. Kindly see the remarks for the reason. `,
          "Status"
        );
      } else {
        console.log("⚠️ No push token found for user:", user.username);
      }

      await Notification.insertOne({
        userID: user._id,
        title: `❌ Court Reservation Request Rejected`,
        message: `Your court reservation request scheduled on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime} has been rejected. Kindly see the remarks for the reason. `,
        redirectTo: "Status",
      });

      sendNotificationUpdate(user._id.toString(), io);
    }

    return res.status(200).json({
      message: "Court reservation is rejected successfully",
    });
  } catch (error) {
    console.error("Error in rejecting court reservation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createReservation = async (req, res) => {
  try {
    const { reservationForm } = req.body;
    const reservation = new CourtReservation({
      ...reservationForm,
    });
    await reservation.save();
    return res
      .status(200)
      .json({ message: "Court reservation requested successfully!" });
  } catch (error) {
    console.error("Error submitting court reservation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const approveReservation = async (req, res) => {
  try {
    const { reservationID } = req.params;
    const reservation = await CourtReservation.findById(reservationID);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const resident = await Resident.findById(reservation.resID).select(
      "userID"
    );

    reservation.status = "Approved";
    await reservation.save();

    let timesObj =
      reservation.times instanceof Map
        ? Object.fromEntries(reservation.times)
        : reservation.times;

    let formattedSchedule = Object.entries(timesObj)
      .map(([date, time]) => {
        const dateStr = new Date(date + "T00:00:00").toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        );
        const start = new Date(time.starttime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        const end = new Date(time.endtime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return `${dateStr} from ${start} to ${end}`;
      })
      .join("; ");

    if (resident.userID) {
      const user = await User.findById(resident.userID);
      const io = req.app.get("socketio");
      io.to(user._id.toString()).emit("reservationUpdate", {
        title: `📅 Court Reservation Update`,
        message: `Your court reservation request scheduled on ${formattedSchedule} has been approved. `,
        timestamp: reservation.updatedAt,
      });

      if (user?.pushtoken) {
        await sendPushNotification(
          user.pushtoken,
          `📅 Court Reservation Update`,
          `Your court reservation request scheduled on ${formattedSchedule} has been approved. `,
          "Status"
        );
      } else {
        console.log("⚠️ No push token found for user:", user.username);
      }

      await Notification.insertOne({
        userID: user._id,
        title: `📅 Court Reservation Update`,
        message: `Your court reservation request scheduled on ${formattedSchedule} has been approved.`,
        redirectTo: "Status",
      });

      sendNotificationUpdate(user._id.toString(), io);
    }

    return res
      .status(200)
      .json({ message: "Court reservation successfully approved" });
  } catch (error) {
    console.error("Error in approving court reservations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPendingReservationsCount = async (req, res) => {
  try {
    const reservations = await getPendingReservations();

    return res.status(200).json(reservations);
  } catch (error) {
    console.error("Error in fetching court reservations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getReservations = async (req, res) => {
  try {
    const reservation = await getReservationsUtils();
    return res.status(200).json(reservation);
  } catch (error) {
    console.error("Error in fetching court reservations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
