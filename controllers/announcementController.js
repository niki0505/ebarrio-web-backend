import Announcement from "../models/Announcements.js";
import mongoose from "mongoose";

export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().populate({
      path: "uploadedby",
      select: "position",
      populate: {
        path: "resID",
        select: "firstname middlename lastname",
      },
    });
    return res.status(200).json(announcements);
  } catch (error) {
    console.error("Error in fetching certificate:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { announcementForm } = req.body;

    const announcement = new Announcement(announcementForm);

    await announcement.save();

    return res.status(200).json({
      message: "Announcement is created successfully",
    });
  } catch (error) {
    console.error("Error in creating announcement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
