import { verifyQR } from "../controllers/brgyIDController.js";
import { verifyEmployeeQR } from "../controllers/employeeIDController.js";
import express from "express";
const router = express.Router();

router.get("/verifyResident/:qrToken", verifyQR);
router.get("/verifyEmployee/:qrToken", verifyEmployeeQR);

export default router;
