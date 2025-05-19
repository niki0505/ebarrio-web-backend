export const connectedUsers = new Map(); // key: userId, value: socket.id

export const registerSocketEvents = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (userID) => {
      connectedUsers.set(userID, socket.id);
      socket.join(userID); // Personal rooms
    });

    socket.on("join_announcements", () => {
      socket.join("announcements");
      console.log(`Socket ${socket.id} joined announcements room`);
    });

    socket.on("disconnect", () => {
      connectedUsers.forEach((id, userID) => {
        if (id === socket.id) {
          connectedUsers.delete(userID);
          console.log(`User ${userID} removed from connectedUsers`);
        }
      });
    });
  });
};
