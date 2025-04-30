import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import { connectDB } from "./config/db.js";
import routes from "./routes/routes.js";
import qrCodeRoute from "./routes/qrCodeRoute.js";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

configDotenv();

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 A user connected:", socket.id);

  socket.on("updateData", (data) => {
    console.log("📩 Data received:", data);
    io.emit("dataUpdated", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 A user disconnected:", socket.id);
  });
});

app.use("/api", routes);
app.use("/", qrCodeRoute);

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
