import Announcement from "../models/Announcements.js";
import mongoose from "mongoose";
import {
  getAnnouncementsUtils,
  sendPushNotification,
} from "../utils/collectionUtils.js";
import { connectedUsers } from "../utils/socket.js";
import Employee from "../models/Employees.js";
import Notification from "../models/Notifications.js";
import User from "../models/Users.js";
import { sendNotificationUpdate } from "../utils/collectionUtils.js";
import ActivityLog from "../models/ActivityLogs.js";

export const recoverAnnouncement = async (req, res) => {
  try {
    const { userID } = req.user;
    const { announcementID } = req.params;
    const announcement = await Announcement.findById(announcementID);
    announcement.status = "Not Pinned";
    await announcement.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "Recover",
      target: "Announcements",
      description: `User recovered an announcement titled ${announcement.title}`,
    });
    return res
      .status(200)
      .json({ message: "Announcement successfully recovered." });
  } catch (error) {
    console.error("Error in recovering announcement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editAnnouncement = async (req, res) => {
  try {
    const { userID } = req.user;
    const { announcementID } = req.params;
    const { announcementForm } = req.body;

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      announcementID,
      announcementForm,
      { new: true }
    );

    await ActivityLog.insertOne({
      userID: userID,
      action: "Update",
      target: "Announcements",
      description: `User updated an announcement titled ${updatedAnnouncement.title}`,
    });

    return res.status(200).json({
      message: "Announcement is updated successfully",
    });
  } catch (error) {
    console.error("Error in updating announcement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAnnouncement = async (req, res) => {
  try {
    const { announcementID } = req.params;
    const announcement = await Announcement.findById(announcementID);
    return res.status(200).json(announcement);
  } catch (error) {
    console.error("Error in fetching announcement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const archiveAnnouncement = async (req, res) => {
  try {
    const { userID } = req.user;
    const { announcementID } = req.params;
    const announcement = await Announcement.findById(announcementID);
    announcement.status = "Archived";
    await announcement.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "Archive",
      target: "Announcements",
      description: `User archived an announcement titled ${announcement.title}`,
    });
    return res
      .status(200)
      .json({ message: "Announcement successfully archived!" });
  } catch (error) {
    console.error("Error in archiving announcement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unpinAnnouncement = async (req, res) => {
  try {
    const { userID } = req.user;
    const { announcementID } = req.params;
    const announcement = await Announcement.findById(announcementID);
    announcement.status = "Not Pinned";
    await announcement.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "Unpin",
      target: "Announcements",
      description: `User unpinned an announcement titled ${announcement.title}`,
    });
    return res
      .status(200)
      .json({ message: "Announcement successfully unpinned!" });
  } catch (error) {
    console.error("Error in unpinning announcement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const pinAnnouncement = async (req, res) => {
  try {
    const { userID } = req.user;
    const { announcementID } = req.params;
    const announcement = await Announcement.findById(announcementID);
    announcement.status = "Pinned";
    await announcement.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "Pin",
      target: "Announcements",
      description: `User pinned an announcement titled ${announcement.title}`,
    });
    return res
      .status(200)
      .json({ message: "Announcement successfully pinned!" });
  } catch (error) {
    console.error("Error in pinning announcement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await getAnnouncementsUtils();
    return res.status(200).json(announcements);
  } catch (error) {
    console.error("Error in fetching announcements:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { announcementForm } = req.body;
    const { userID: adminID, empID } = req.user;
    announcementForm.uploadedby = empID;

    const user = await User.find().select("pushtoken");

    const announcement = new Announcement(announcementForm);
    const userID = await Employee.findById(announcementForm.uploadedby).select(
      "userID"
    );

    await announcement.save();

    const io = req.app.get("socketio");

    const senderSocketId = connectedUsers.get(userID.userID.toString());

    io.except(senderSocketId.socketId)
      .to("announcements")
      .emit("announcement", {
        title: `📢 ${announcement.title}`,
        message: announcement.content,
        timestamp: announcement.createdAt,
      });

    const allUsers = await User.find(
      {
        status: { $in: ["Active", "Inactive"] },
        _id: { $ne: userID.userID },
      },
      "_id"
    );

    const notifications = allUsers.map((user) => ({
      userID: user._id,
      title: `📢 ${announcement.title}`,
      message: announcement.content,
      redirectTo: "Announcements",
    }));

    await Notification.insertMany(notifications);

    for (const element of user) {
      if (element?.pushtoken) {
        await sendPushNotification(
          element.pushtoken,
          `📢 ${announcement.title}`,
          `${announcement.content}`,
          "Announcements"
        );
      }
      sendNotificationUpdate(element._id.toString(), io);
    }

    await ActivityLog.insertOne({
      userID: adminID,
      action: "Create",
      target: "Announcements",
      description: `User posted an announcement titled ${announcement.title}`,
    });

    return res.status(200).json({
      message: "Announcement is created successfully",
    });
  } catch (error) {
    console.error("Error in creating announcement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
