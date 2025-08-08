import FAQ from "../models/FAQs.js";
import ActivityLog from "../models/ActivityLogs.js";
import Chat from "../models/Chats.js";
import { getFAQsUtils } from "../utils/collectionUtils.js";

export const archiveFAQ = async (req, res) => {
  try {
    const { userID } = req.user;
    const { faqID } = req.params;

    const faq = await FAQ.findById(faqID);
    faq.status = "Archived";

    await faq.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "FAQs",
      description: `User archived a FAQ.`,
    });

    return res.status(200).json({
      message: "FAQ is archived successfully",
    });
  } catch (error) {
    console.error("Error in updating FAQs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editFAQ = async (req, res) => {
  try {
    const { userID } = req.user;
    const { faqID } = req.params;
    const { question, answer } = req.body;

    const faq = await FAQ.findById(faqID);
    faq.question = question;
    faq.answer = answer;

    await faq.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "FAQs",
      description: `User updated a FAQ.`,
    });

    return res.status(200).json({
      message: "FAQ is updated successfully",
    });
  } catch (error) {
    console.error("Error in updating FAQs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const endChat = async (req, res) => {
  try {
    const { userID } = req.user;
    const { chatID } = req.params;
    const io = req.app.get("socketio");

    const chat = await Chat.findById(chatID);

    chat.status = "Ended";
    await chat.save();

    io.to(chat._id.toString()).emit("chat_ended", {
      chatID: chat._id.toString(),
      timestamp: new Date(),
    });

    const residentID = chat.participants.find(
      (id) => id.toString() !== userID.toString()
    );

    // Dummy ObjectId for system/bot messages
    const SYSTEM_USER_ID = "000000000000000000000000";

    const botMessages = [
      {
        from: SYSTEM_USER_ID,
        to: residentID,
        message: "Hi! How can I help you today? 😊",
        timestamp: new Date(),
      },
      {
        from: SYSTEM_USER_ID,
        to: residentID,
        message: JSON.stringify({
          type: "button",
          options: [
            { id: "faq", label: "Ask a Question" },
            { id: "chat", label: "Chat with the Barangay" },
          ],
        }),
        timestamp: new Date(),
      },
    ];

    const newChat = new Chat({
      participants: [residentID],
      responder: null,
      messages: botMessages,
      status: "Active",
      isBot: true,
    });

    await newChat.save();

    io.to(residentID.toString()).emit("chat_assigned", {
      ...newChat.toObject(),
    });

    res.status(200).json({ message: "Chat has been successfully ended." });
  } catch (error) {
    console.error("Error in ending the chat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChat = async (req, res) => {
  try {
    const { userID } = req.user;
    const { roomId } = req.params;

    const chat = await Chat.findOne({
      _id: roomId,
      participants: userID, // ensure user is a participant
    })
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
        ],
      });

    if (!chat) {
      return res
        .status(404)
        .json({ message: "Chat not found or access denied" });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error in getting chat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChats = async (req, res) => {
  try {
    const { userID } = req.user; // assuming auth middleware sets req.user

    const chats = await Chat.find({ isBot: { $ne: true } })
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
        ],
      });

    res.status(200).json(chats);
  } catch (error) {
    console.error("Error in getting chats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFAQs = async (req, res) => {
  try {
    const faqs = await getFAQsUtils();

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
