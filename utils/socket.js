export const connectedUsers = new Map();
import User from "../models/Users.js";
import Chat from "../models/Chats.js";
import { sendPushNotification } from "./collectionUtils.js";
import mongoose from "mongoose";

async function markUserActive(userId) {
  await User.findByIdAndUpdate(userId, { status: "Active" });
}

async function markUserInactive(userId) {
  const user = await User.findById(userId);
  if (user.status === "Active") {
    user.status = "Inactive";
    await user.save();
  }
}

export const registerSocketEvents = (io) => {
  const websiteNamespace = io.of("/website");

  websiteNamespace.on("connection", (socket) => {
    console.log("User connected to /website namespace:", socket.id);

    socket.on("register", async (userID, role) => {
      socket.join(userID);
      console.log(`Socket joined room: ${userID}`);

      // Count members in this room
      const room = socket.nsp.adapter.rooms.get(userID);
      const memberCount = room ? room.size : 0;
      console.log(`Room ${userID} has ${memberCount} member(s).`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from /website namespace:", socket.id);
    });
  });
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", async (userID, role) => {
      connectedUsers.set(userID, {
        socketId: socket.id,
        role,
      });
      socket.userID = userID;
      socket.role = role;
      markUserActive(userID);
      socket.join(userID);
      console.log(`Socket joined room: ${userID}`);

      if (["Secretary", "Clerk", "Justice"].includes(role)) {
        const activeChats = await Chat.find({
          participants: userID,
          status: "Active",
          isBot: false,
        });

        for (const chat of activeChats) {
          const roomId = chat._id.toString();
          socket.join(roomId);
          console.log(`🔁 Staff (${role}) rejoined room: ${roomId}`);
        }
      }
    });

    socket.on("unregister", (userID) => {
      socket.leave(userID);
      markUserInactive(userID);
      connectedUsers.delete(userID);
    });

    socket.on("join_announcements", () => {
      socket.join("announcements");
      console.log(`Socket ${socket.id} joined announcements room`);
    });

    socket.on("join_sos", () => {
      socket.join("sos");
      console.log(`Socket ${socket.id} joined sos room`);
    });

    socket.on("join_chats", () => {
      socket.join("chats");
      console.log(`Socket ${socket.id} joined chats room`);
    });

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`✅ Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("disconnect", () => {
      connectedUsers.forEach((info, userID) => {
        if (info.socketId === socket.id) {
          connectedUsers.delete(userID);
          markUserInactive(userID);
          console.log(`User ${userID} removed from connectedUsers`);
        }
      });
    });

    // CHAT

    const SYSTEM_USER_ID = "000000000000000000000000";

    socket.on("request_bot_chat", async ({ userID }) => {
      try {
        // Check if there's already an active staff chat
        const hasActiveStaffChat = await Chat.findOne({
          participants: new mongoose.Types.ObjectId(userID),
          isBot: false,
          status: "Active",
        });

        if (hasActiveStaffChat) {
          console.log("❌ Cannot start bot chat: active staff chat exists.");
          io.to(userID.toString()).emit("chat_assigned", {
            _id: hasActiveStaffChat._id.toString(),
            participants: hasActiveStaffChat.participants,
            responder: hasActiveStaffChat.responder,
            messages: hasActiveStaffChat.messages,
            status: hasActiveStaffChat.status,
            isCleared: hasActiveStaffChat.isCleared,
            isBot: hasActiveStaffChat.isBot,
            createdAt: hasActiveStaffChat.createdAt,
            updatedAt: hasActiveStaffChat.updatedAt,
          });
          return;
        }

        // Check if an active bot chat already exists
        const existingChat = await Chat.findOne({
          isBot: true,
          participants: userID,
          status: "Active",
        });

        if (existingChat) {
          io.to(userID.toString()).emit("chat_assigned", {
            _id: existingChat._id.toString(),
            participants: existingChat.participants,
            responder: SYSTEM_USER_ID,
            messages: existingChat.messages,
            status: existingChat.status,
            isCleared: existingChat.isCleared,
            isBot: existingChat.isBot,
            createdAt: existingChat.createdAt,
            updatedAt: existingChat.updatedAt,
          });
          return;
        }

        // Create new bot chat
        const botMessages = [
          {
            from: SYSTEM_USER_ID,
            to: userID,
            message: "Hi! How can I help you today? 😊",
            timestamp: new Date(),
          },
          {
            from: SYSTEM_USER_ID,
            to: userID,
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
          participants: [userID],
          responder: null,
          messages: botMessages,
          status: "Active",
          isBot: true,
        });

        await newChat.save();

        io.to(userID.toString()).emit("chat_assigned", {
          _id: newChat._id.toString(),
          participants: newChat.participants,
          responder: newChat.responder,
          messages: newChat.messages,
          status: newChat.status,
          isCleared: newChat.isCleared,
          isBot: newChat.isBot,
          createdAt: newChat.createdAt,
          updatedAt: newChat.updatedAt,
        });
      } catch (error) {
        console.error("Error in request_bot_chat:", error);
      }
    });

    socket.on("request_chat", async (callback) => {
      if (socket.role !== "Resident") return;

      let assignedStaffId = null;
      let isNewChat = null;

      // End previous active bot chat
      const existingBotChat = await Chat.findOne({
        participants: socket.userID,
        isBot: true,
        status: "Active",
      });

      if (existingBotChat) {
        existingBotChat.status = "Ended";
        existingBotChat.messages.push({
          from: SYSTEM_USER_ID,
          to: socket.userID,
          message: "This chat has ended.",
          timestamp: new Date(),
        });
        await existingBotChat.save();
        console.log(
          "☑️ Ended previous bot chat:",
          existingBotChat._id.toString()
        );
        const residentSocketId = connectedUsers.get(socket.userID)?.socketId;
        if (residentSocketId) {
          io.to(residentSocketId).emit("receive_message", {
            from: SYSTEM_USER_ID,
            to: socket.userID,
            message: "This chat has ended.",
            timestamp: new Date(),
            roomId: existingBotChat._id,
          });
        }
      }

      // Always include Secretary, Clerk, and Justice
      const staffUsers = await User.find({
        role: { $in: ["Secretary", "Clerk", "Justice"] },
        status: { $nin: ["Archived", "Deactivated"] },
      });
      if (staffUsers.length === 0) {
        console.log("❌ No Secretary or Clerk users found in DB");
        return;
      }

      const staffUserIDs = staffUsers.map((user) => user._id.toString());
      assignedStaffId = staffUserIDs[0];

      const participantIds = [socket.userID, ...staffUserIDs];

      // Look for existing active chat involving the resident and staff
      let chat = await Chat.findOne({
        participants: { $all: participantIds },
        status: "Active",
      });

      // If none, create one
      if (!chat) {
        const defaultMessage = {
          from: assignedStaffId,
          to: socket.userID,
          message:
            "This conversation has been forwarded to the barangay office. An admin will get back to you shortly.",
          timestamp: new Date(),
        };

        chat = new Chat({
          participants: participantIds,
          status: "Active",
          messages: [defaultMessage],
        });

        await chat.save();
        isNewChat = true;
        console.log("🆕 Created new chat:", chat._id.toString());
      } else {
        console.log("📁 Found existing chat:", chat._id.toString());
      }

      const roomId = chat._id.toString();

      // Lets the Secretary, Clerk, and Justice join the room
      for (let [userId, info] of connectedUsers) {
        if (
          ["Secretary", "Clerk", "Justice"].includes(info.role) &&
          staffUserIDs.includes(userId)
        ) {
          io.to(info.socketId).socketsJoin(roomId);
        }
      }

      // Resident joins too
      socket.join(roomId);
      console.log("🚪 Resident and staff joined room:", roomId);

      io.to(socket.id).emit("chat_assigned", {
        _id: chat._id.toString(),
        participants: chat.participants,
        responder: chat.responder,
        messages: chat.messages,
        status: chat.status,
        isCleared: chat.isCleared,
        isBot: chat.isBot,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      });

      console.log(
        "👥 Assigned staff to resident on chat start:",
        assignedStaffId
      );
      callback({ success: true });
    });

    socket.on(
      "send_message",
      async ({ from, to, message, roomId }, callback) => {
        console.log(`📨 Message received from ${from} to ${to}:`, message);

        const isFromResident = socket.role === "Resident";
        let chat = null;

        if (roomId) {
          chat = await Chat.findById(roomId);
          console.log("🔎 Found chat by roomId:", roomId);
        }

        // If no chat found by roomId, fallback to participants
        if (!chat) {
          chat = await Chat.findOne({
            participants: { $all: [from, to] },
            status: "Active",
          });

          if (chat) {
            console.log("📁 Found chat by participants:", chat._id.toString());
            roomId = chat._id.toString();
          }
        }

        // If still no chat, create a new one
        if (!chat) {
          chat = new Chat({ participants: [from, to], status: "Active" });
          await chat.save();
          roomId = chat._id.toString();
          console.log("🆕 New chat created with roomId:", roomId);
        }

        // Push the new message
        chat.messages.push({ from, to, message });

        // Auto-assign responder if needed
        if (!chat.responder && socket.role !== "Resident") {
          chat.responder = from;
          console.log("👤 Assigned responder:", from);
        }

        // Save chat
        try {
          await chat.save();
          console.log("✅ Chat saved to DB");
        } catch (err) {
          console.error("❌ Failed to save chat:", err.message);
        }

        // Join the room
        socket.join(roomId);
        const toSocket = connectedUsers.get(to)?.socketId;
        if (toSocket) io.sockets.sockets.get(toSocket)?.join(roomId);
        console.log(`👥 ${from} joined room ${roomId}`);

        io.to(roomId).emit("receive_message", {
          from,
          to,
          message,
          timestamp: new Date(),
          roomId,
        });

        const user = await User.findById(to);

        const preview =
          message.length > 50 ? message.substring(0, 50) + "..." : message;

        await sendPushNotification(
          user.pushtoken,
          `💬 New Message`,
          preview,
          "Chat",
          roomId
        );

        const resident = await User.findById(from).populate(
          "resID",
          "firstname lastname"
        );

        io.to(user._id.toString()).emit("chatUpdate", {
          title: `💬 New Message`,
          message: preview,
          timestamp: new Date(),
          roomId,
        });

        if (resident.resID) {
          io.emit("chats", {
            title: `💬 New Message`,
            message: `${resident.resID.firstname} ${resident.resID.lastname}: ${preview}`,
            timestamp: new Date(),
          });
        }

        console.log("📤 Broadcasted message to room:", roomId);
        callback({ success: true });
      }
    );
  });
};
