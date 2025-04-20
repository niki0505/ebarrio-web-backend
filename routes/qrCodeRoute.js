import { verifyQR } from "../controllers/brgyIDController.js";
import { verifyCertificateQR } from "../controllers/certificatesController.js";
import { verifyEmployeeQR } from "../controllers/employeeIDController.js";
import express from "express";
const router = express.Router();

router.get("/verifyResident/:qrToken", verifyQR);
router.get("/verifyEmployee/:qrToken", verifyEmployeeQR);
router.get("/verifyCertificate/:qrToken", verifyCertificateQR);

export default router;
