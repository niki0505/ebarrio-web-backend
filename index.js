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
import Redis from "ioredis";
import { registerSocketEvents, connectedUsers } from "./utils/socket.js";
import { createAdapter } from "@socket.io/redis-adapter";
import bcrypt from "bcryptjs";
import { captureSnapshot } from "./controllers/snapshotController.js";
import cron from "node-cron";

configDotenv();

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "https://ebarrio.online",
    credentials: true,
  })
);

app.use(express.static("public"));

const rds = new Redis(process.env.REDIS_URL);
const subClient = rds.duplicate();

export { rds };

const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:3000",
  "https://ebarrio.online",
  undefined,
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true); // ✅ allow
      } else {
        callback(new Error("❌ Not allowed by CORS"));
      }
    },
    credentials: true,
  },
});

io.adapter(createAdapter(rds, subClient));

rds.ping((err, result) => {
  if (err) {
    console.error("Error connecting to Redis:", err);
  } else {
    console.log("Connected to Redis:", result);
  }
});

rds.on("error", (err) => {
  console.error("Redis connection error: ", err);
});

rds.on("reconnecting", (time) => {
  console.log(`Redis reconnecting in ${time} ms`);
});

app.set("socketio", io);
app.set("connectedUsers", connectedUsers);

app.use("/api", routes);
app.use("/", qrCodeRoute);

// 2 mins
cron.schedule("*/2 * * * *", () => {
  captureSnapshot();
});

// const plainPassword = "ebarriotechnicaladmin";
// const saltRounds = 10;

// bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
//   if (err) {
//     console.error("Hashing error:", err);
//     return;
//   }

//   console.log("Hashed Password:", hash);
// });

const PORT = process.env.PORT;
server.listen(PORT, async () => {
  try {
    console.log(`Server is running on port ${PORT}`);
    await connectDB();
    registerSocketEvents(io);
    watchAllCollectionsChanges(io);
  } catch (error) {
    console.log("Error during startup:", error);
  }
});
