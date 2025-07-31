export const connectedUsers = new Map();
import User from "../models/Users.js";
import Chat from "../models/Chats.js";

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
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (userID, role) => {
      connectedUsers.set(userID, {
        socketId: socket.id,
        role,
      });
      socket.userID = userID;
      socket.role = role;
      markUserActive(userID);
      socket.join(userID);
      console.log(`Socket joined room: ${userID}`);
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

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`✅ Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("disconnect", () => {
      connectedUsers.forEach((info, userID) => {
        if (info.socketId === socket.id) {
          connectedUsers.delete(userID);
          markUserInactive(userID); // use userID from loop
          console.log(`User ${userID} removed from connectedUsers`);
        }
      });
    });

    //CHAT

    const SYSTEM_USER_ID = "000000000000000000000000";

    socket.on("request_bot_chat", async ({ userID }) => {
      try {
        // 1. Check if an active bot chat already exists for the user
        const existingChat = await Chat.findOne({
          isBot: true,
          participants: userID,
          status: "Active",
        });

        if (existingChat) {
          // Chat already exists — return it instead of creating a new one
          io.to(userID.toString()).emit("chat_assigned", {
            userID: SYSTEM_USER_ID,
            roomId: existingChat._id.toString(),
            botMessages: existingChat.messages,
            isBot: true,
          });
          return;
        }

        // 2. No existing chat, create a new one
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
          userID: SYSTEM_USER_ID,
          roomId: newChat._id.toString(),
          botMessages: botMessages,
          isBot: true,
        });
      } catch (error) {
        console.error("Error in request_bot_chat:", error);
      }
    });

    socket.on("request_chat", async () => {
      if (socket.role !== "Resident") return;

      let target = null;
      let assignedStaffId = null;
      let isNewChat = null;

      for (let [userId, info] of connectedUsers) {
        if (info.role === "Secretary") {
          target = info.socketId;
          assignedStaffId = userId;
          break;
        }
      }

      if (!target) {
        for (let [userId, info] of connectedUsers) {
          if (info.role === "Clerk") {
            target = info.socketId;
            assignedStaffId = userId;
            break;
          }
        }
      }

      if (!assignedStaffId) {
        console.log("❌ No staff available to assign");
        return;
      }

      await Chat.updateMany(
        {
          participants: socket.userID,
          isBot: true,
          status: "Active",
        },
        {
          $set: { status: "Ended" },
          $push: {
            messages: {
              from: null,
              to: socket.userID,
              message: "This chat has ended.",
              timestamp: new Date(),
            },
          },
        }
      );

      // ✅ Try to find existing chat between them
      let chat = await Chat.findOne({
        participants: { $all: [socket.userID, assignedStaffId] },
        status: "Active",
      });

      // ✅ If none, create a new chat
      if (!chat) {
        const defaultMessage = {
          from: assignedStaffId,
          to: socket.userID,
          message:
            "Your chat has been transferred to an available staff. How can we help you today?",
          timestamp: new Date(),
        };

        chat = new Chat({
          participants: [socket.userID, assignedStaffId],
          status: "Active",
          messages: [defaultMessage], // Include the default message here
        });

        await chat.save();
        isNewChat = true;

        console.log("🆕 Created new chat:", chat._id.toString());
      } else {
        console.log("📁 Found existing chat:", chat._id.toString());
      }

      const roomId = chat._id.toString();

      // ✅ Make the resident join the room now (optional but helpful)
      socket.join(roomId);
      console.log("🚪 Resident joined room:", roomId);

      // ✅ Tell resident the assigned staff and roomId
      io.to(socket.id).emit("chat_assigned", {
        userID: assignedStaffId,
        roomId,
        adminMessages: isNewChat ? chat.messages : [],
      });

      console.log(
        "👥 Assigned staff to resident on chat start:",
        assignedStaffId
      );
    });

    socket.on("send_message", async ({ from, to, message, roomId }) => {
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
      console.log(`👥 ${from} joined room ${roomId}`);

      if (isFromResident) {
        // Find target staff to notify
        let target = null;
        let assignedStaffId = null;

        for (let [userId, info] of connectedUsers) {
          if (info.role === "Secretary") {
            target = info.socketId;
            assignedStaffId = userId;
            break;
          }
        }

        if (!target) {
          for (let [userId, info] of connectedUsers) {
            if (info.role === "Clerk") {
              target = info.socketId;
              assignedStaffId = userId;
              break;
            }
          }
        }

        if (assignedStaffId && connectedUsers.has(assignedStaffId)) {
          io.to(assignedStaffId).emit("receive_message", {
            from,
            to,
            message,
            timestamp: new Date(),
            roomId: chat._id,
          });
        } else {
          console.log("❗ No clerk or secretary online. Message pending.");
        }
      } else {
        // Staff replies to resident
        const residentSocket = connectedUsers.get(to);
        if (residentSocket) {
          io.to(residentSocket.socketId).socketsJoin(roomId);
          io.to(roomId).emit("receive_message", {
            from,
            to,
            message,
            timestamp: new Date(),
            roomId,
          });

          console.log("📤 Sent message to resident:", to);
        }
      }
    });
  });
};
