import Announcement from "../models/Announcements.js";
import mongoose from "mongoose";
import { getAnnouncementsUtils } from "../utils/collectionUtils.js";

export const editAnnouncement = async (req, res) => {
  try {
    const { announcementID } = req.params;
    const { announcementForm } = req.body;

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      announcementID,
      announcementForm,
      { new: true }
    );

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
    const { announcementID } = req.params;
    const announcement = await Announcement.findById(announcementID);
    announcement.status = "Archived";
    await announcement.save();
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
    const { announcementID } = req.params;
    const announcement = await Announcement.findById(announcementID);
    announcement.status = "Not Pinned";
    await announcement.save();
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
    const { announcementID } = req.params;
    const announcement = await Announcement.findById(announcementID);
    announcement.status = "Pinned";
    await announcement.save();
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
