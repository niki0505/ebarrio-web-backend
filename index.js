import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import { connectDB } from "./config/db.js";
import routes from "./routes/routes.js";
import qrCodeRoute from "./routes/qrCodeRoute.js";
import cookieParser from "cookie-parser";

configDotenv();

const app = express();
app.use(express.json());
// app.use(cors());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use("/api", routes);
app.use("/", qrCodeRoute);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
