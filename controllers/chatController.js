import FAQ from "../models/FAQs.js";
import ActivityLog from "../models/ActivityLogs.js";
import Chat from "../models/Chats.js";

export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate({
        path: "participants",
        select: "resID empID",
        populate: [
          { path: "resID", select: "firstname lastname picture" },
          {
            path: "empID",
            populate: {
              path: "resID",
              select: "firstname lastname picture",
            },
          },
          ,
        ],
      })
      .populate({
        path: "messages.from",
        select: "resID empID",
        populate: [
          { path: "resID", select: "firstname lastname picture" },
          {
            path: "empID",
            populate: {
              path: "resID",
              select: "firstname lastname picture",
            },
          },
          ,
        ],
      })
      .populate({
        path: "messages.to",
        select: "resID empID",
        populate: [
          { path: "resID", select: "firstname lastname picture" },
          {
            path: "empID",
            populate: {
              path: "resID",
              select: "firstname lastname picture",
            },
          },
          ,
        ],
      });

    return res.status(200).json(chats);
  } catch (error) {
    console.error("Error in getting chats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find();

    return res.status(200).json(faqs);
  } catch (error) {
    console.error("Error in getting FAQs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createFAQ = async (req, res) => {
  try {
    const { userID } = req.user;
    const { question, answer } = req.body;

    const faq = new FAQ({ question, answer });

    await faq.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "FAQs",
      description: `User added new FAQ.`,
    });

    return res.status(200).json({
      message: "FAQ is created successfully",
    });
  } catch (error) {
    console.error("Error in creating FAQs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
