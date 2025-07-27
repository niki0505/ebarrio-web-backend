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

    socket.on("request_chat", () => {
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

      if (assignedStaffId) {
        io.to(socket.id).emit("chat_assigned", { userID: assignedStaffId });
        console.log(
          "👥 Assigned staff to resident on chat start:",
          assignedStaffId
        );
      } else {
        console.log("❌ No staff available to assign");
      }
    });

    socket.on("send_message", async ({ from, to, message }) => {
      console.log(`📨 Message received from ${from} to ${to}:`, message);
      const isFromResident = socket.role === "Resident";
      let chat = await Chat.findOne({
        participants: { $all: [from, to] },
        status: "Active",
      });

      if (!chat) {
        chat = new Chat({ participants: [from, to], status: "Active" });
      }

      chat.messages.push({ from, to, message });

      // Auto-assign responder if null
      if (!chat.responder && socket.role !== "Resident") {
        chat.responder = from; // clerk or secretary took the convo
      }

      try {
        await chat.save();
        console.log("✅ Chat saved to DB");
      } catch (err) {
        console.error("❌ Failed to save chat:", err.message);
      }

      // Determine which staff to notify if from resident
      if (isFromResident) {
        // Search connected users for secretary first
        let target = null;
        let assignedStaffId = null;

        for (let [userId, info] of connectedUsers) {
          if (info.role === "Secretary") {
            target = info.socketId;
            assignedStaffId = userId;
            break;
          }
        }

        // If no secretary, check for clerk
        if (!target) {
          for (let [userId, info] of connectedUsers) {
            if (info.role === "Clerk") {
              target = info.socketId;
              assignedStaffId = userId;
              break;
            }
          }
        }

        if (target) {
          // Notify staff
          io.to(target).emit("receive_message", {
            from,
            to,
            message,
            timestamp: new Date(),
          });

          console.log("📤 Sent message to staff:", assignedStaffId);
        } else {
          // No one online → mark as pending (optional)
          console.log("No clerk or secretary online. Marking as pending.");
        }
      } else {
        // Staff reply — notify the resident
        const residentSocket = connectedUsers.get(to);
        if (residentSocket) {
          io.to(residentSocket.socketId).emit("receive_message", {
            from,
            to,
            message,
            timestamp: new Date(),
          });
        }
      }
    });
  });
};
