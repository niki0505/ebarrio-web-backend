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
          markUserInactive(socket.userID);
          console.log(`User ${userID} removed from connectedUsers`);
        }
      });
    });

    //CHAT

    socket.on("request_chat", async () => {
      if (socket.role !== "Resident") return;

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

      if (!assignedStaffId) {
        console.log("❌ No staff available to assign");
        return;
      }

      // ✅ Try to find existing chat between them
      let chat = await Chat.findOne({
        participants: { $all: [socket.userID, assignedStaffId] },
        status: "Active",
      });

      // ✅ If none, create a new chat
      if (!chat) {
        chat = new Chat({
          participants: [socket.userID, assignedStaffId],
          status: "Active",
        });
        await chat.save();
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
