import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import { connectDB } from "./config/db.js";
import routes from "./routes/routes.js";
import qrCodeRoute from "./routes/qrCodeRoute.js";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import { watchAllCollectionsChanges } from "./controllers/watchDB.js";

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

app.set("socketio", io);

app.use("/api", routes);
app.use("/", qrCodeRoute);

const PORT = process.env.PORT;
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectDB();
  watchAllCollectionsChanges(io);
});
