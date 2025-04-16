import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";

configDotenv();

const ACCESS_SECRET = process.env.ACCESS_SECRET;

const authMiddleware = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });
  }
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired." });
    }
    return res.status(403).json({ message: "Token invalid." });
  }
};

export default authMiddleware;
