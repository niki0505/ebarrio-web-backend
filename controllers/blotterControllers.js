import Blotter from "../models/Blotters.js";
import {
  getBlottersUtils,
  getPendingBlotters,
} from "../utils/collectionUtils.js";
import Resident from "../models/Residents.js";
import User from "../models/Users.js";
import { sendPushNotification } from "../utils/collectionUtils.js";
import Notification from "../models/Notifications.js";
import { sendNotificationUpdate } from "../utils/collectionUtils.js";

export const getPendingBlottersCount = async (req, res) => {
  try {
    const blotter = await getPendingBlotters();

    return res.status(200).json(blotter);
  } catch (error) {
    console.error("Error in fetching court reservations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectBlotter = async (req, res) => {
  try {
    const { blotterID } = req.params;
    const { remarks } = req.body;

    const blotter = await Blotter.findById(blotterID);
    const resident = await Resident.findById(blotter.complainantID).select(
      "userID"
    );

    blotter.status = "Rejected";
    blotter.remarks = remarks;
    await blotter.save();

    if (resident && resident.userID) {
      const user = await User.findById(resident.userID);
      const io = req.app.get("socketio");
      io.to(user._id.toString()).emit("blotterUpdate", {
        title: `❌ Blotter Rejected`,
        message: `Your blotter report has been rejected. Kindly see the remarks for the reason.`,
        timestamp: blotter.updatedAt,
      });

      if (user?.pushtoken) {
        await sendPushNotification(
          user.pushtoken,
          `❌ Blotter Rejected`,
          `Your blotter report has been rejected. Kindly see the remarks for the reason.`,
          "Status"
        );
      } else {
        console.log("⚠️ No push token found for user:", user.username);
      }

      await Notification.insertOne({
        userID: user._id,
        title: `❌ Blotter Rejected`,
        message: `Your blotter report has been rejected. Kindly see the remarks for the reason.`,
        redirectTo: "Status",
      });

      sendNotificationUpdate(user._id.toString(), io);
    }

    return res.status(200).json({
      message: "Blotter is rejected successfully",
    });
  } catch (error) {
    console.error("Error in rejecting blotter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const settleBlotter = async (req, res) => {
  try {
    const { blotterID } = req.params;
    const { updatedForm } = req.body;

    const prev = await Blotter.findById(blotterID);
    if (!prev) {
      return res.status(404).json({ message: "Blotter not found" });
    }

    const blotter = await Blotter.findById(blotterID);
    Object.assign(blotter, updatedForm);
    blotter.status = "Settled";

    await blotter.save();

    const resident = await Resident.findById(blotter.complainantID).select(
      "userID"
    );

    if (resident && resident.userID) {
      const user = await User.findById(resident.userID);
      const io = req.app.get("socketio");
      io.to(user._id.toString()).emit("blotterUpdate", {
        title: `✅ Blotter Settled`,
        message: `Your blotter report has been settled.`,
        timestamp: blotter.updatedAt,
      });

      if (user?.pushtoken) {
        await sendPushNotification(
          user.pushtoken,
          `✅ Blotter Settled`,
          `Your blotter report has been settled.`,
          "Status"
        );
      } else {
        console.log("⚠️ No push token found for user:", user.username);
      }

      await Notification.insertOne({
        userID: user._id,
        title: `✅ Blotter Settled`,
        message: `Your blotter report has been settled.`,
        redirectTo: "Status",
      });

      sendNotificationUpdate(user._id.toString(), io);
    }

    return res.status(200).json({
      message: "Blotter is settled successfully",
    });
  } catch (error) {
    console.error("Error in settling blotter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editScheduleBlotter = async (req, res) => {
  try {
    const { blotterID } = req.params;
    const { scheduleForm } = req.body;
    const blotter = await Blotter.findById(blotterID);
    const resident = await Resident.findById(blotter.complainantID).select(
      "userID"
    );

    blotter.starttime = scheduleForm.starttime;
    blotter.endtime = scheduleForm.endtime;

    await blotter.save();

    const startTime = new Date(blotter.starttime);
    const endTime = new Date(blotter.endtime);

    const dateOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Manila",
    };
    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    };

    const formattedDate = startTime.toLocaleDateString("en-US", dateOptions);
    const formattedStartTime = startTime.toLocaleTimeString(
      "en-US",
      timeOptions
    );

    const formattedEndTime = endTime.toLocaleTimeString("en-US", timeOptions);

    if (resident.userID) {
      const user = await User.findById(resident.userID);
      const io = req.app.get("socketio");
      io.to(user._id.toString()).emit("blotterUpdate", {
        title: `📅 Blotter Update`,
        message: `Your blotter report has been rescheduled for discussion on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime}. `,
        timestamp: blotter.updatedAt,
      });

      if (user?.pushtoken) {
        await sendPushNotification(
          user.pushtoken,
          `📅 Blotter Update`,
          `Your blotter report has been rescheduled for discussion on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime}. `,
          "Status"
        );
      } else {
        console.log("⚠️ No push token found for user:", user.username);
      }

      await Notification.insertOne({
        userID: user._id,
        title: `📅 Blotter Update`,
        message: `Your blotter report has been rescheduled for discussion on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime}.`,
        redirectTo: "Status",
      });

      sendNotificationUpdate(user._id.toString(), io);
    }

    return res
      .status(200)
      .json({ message: "Blotter's schedule successfully updated!" });
  } catch (error) {
    console.error("Error in updating blotter schedule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const scheduleBlotter = async (req, res) => {
  try {
    const { blotterID } = req.params;
    const { scheduleForm } = req.body;
    const blotter = await Blotter.findById(blotterID);
    const resident = await Resident.findById(blotter.complainantID).select(
      "userID"
    );

    blotter.starttime = scheduleForm.starttime;
    blotter.endtime = scheduleForm.endtime;
    blotter.status = "Scheduled";

    await blotter.save();
    blotter.scheduleAt = blotter.updatedAt;

    await blotter.save();

    const startTime = new Date(blotter.starttime);
    const endTime = new Date(blotter.endtime);

    const dateOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Manila",
    };
    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    };

    const formattedDate = startTime.toLocaleDateString("en-US", dateOptions);
    const formattedStartTime = startTime.toLocaleTimeString(
      "en-US",
      timeOptions
    );

    const formattedEndTime = endTime.toLocaleTimeString("en-US", timeOptions);

    if (resident && resident.userID) {
      const user = await User.findById(resident.userID);
      const io = req.app.get("socketio");
      io.to(user._id.toString()).emit("blotterUpdate", {
        title: `📅 Blotter Update`,
        message: `Your blotter report has been scheduled for discussion on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime}. `,
        timestamp: blotter.updatedAt,
      });

      if (user?.pushtoken) {
        await sendPushNotification(
          user.pushtoken,
          `📅 Blotter Update`,
          `Your blotter report has been scheduled for discussion on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime}. `,
          "Status"
        );
      } else {
        console.log("⚠️ No push token found for user:", user.username);
      }

      await Notification.insertOne({
        userID: user._id,
        title: `📅 Blotter Update`,
        message: `Your blotter report has been scheduled for discussion on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime}.`,
        redirectTo: "Status",
      });

      sendNotificationUpdate(user._id.toString(), io);
    }
    return res.status(200).json({ message: "Blotter successfully scheduled!" });
  } catch (error) {
    console.error("Error in scheduling blotter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBlotter = async (req, res) => {
  try {
    const { blotterID } = req.params;
    const blotter = await Blotter.findById(blotterID)
      .populate({
        path: "complainantID",
        select:
          "firstname middlename lastname signature householdno mobilenumber",
        populate: {
          path: "householdno",
          select: "address",
        },
      })
      .populate({
        path: "subjectID",
        select: "firstname middlename lastname signature householdno",
        populate: {
          path: "householdno",
          select: "address",
        },
      })
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

    const formattedBlotter = {
      ...blotter.toObject(),
      createdAt: formatDatePH(blotter.createdAt),
      updatedAt: formatDatePH(blotter.updatedAt),
      scheduleAt: formatDatePH(blotter.scheduleAt),
    };

    return res.status(200).json(formattedBlotter);
  } catch (error) {
    console.error("Error in fetching blotter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBlotters = async (req, res) => {
  try {
    const blotters = await getBlottersUtils();
    return res.status(200).json(blotters);
  } catch (error) {
    console.error("Error in creating blotter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createBlotter = async (req, res) => {
  try {
    const { updatedForm } = req.body;
    if (updatedForm.starttime && updatedForm.starttime !== "") {
      updatedForm.status = "Scheduled";
    } else {
      updatedForm.status = "Pending";
    }

    const blotter = new Blotter(updatedForm);

    await blotter.save();

    return res.status(200).json({
      message: "Blotter is created successfully",
    });
  } catch (error) {
    console.error("Error in creating blotter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
