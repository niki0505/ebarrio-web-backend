import express from "express";
import {
  archiveEmployee,
  archiveResident,
  checkPositions,
  createEmployee,
  createResident,
  getAllEmployees,
  getAllOldResidents,
  getAllOldUsers,
  getAllResidents,
  getAllUsers,
  getResident,
  updateResident,
  createUser,
  getCaptain,
  getEmployee,
} from "../controllers/infoController.js";
import {
  checkIfEmployee,
  checkRefreshToken,
  checkUsername,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  sendOTP,
} from "../controllers/authController.js";
import { generateBrgyID, saveBrgyID } from "../controllers/brgyIDController.js";
import {
  generateEmployeeID,
  saveEmployeeID,
} from "../controllers/employeeIDController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  generateCertificate,
  generateCertificateReq,
  getAllCertificateRequests,
  getCertificate,
  getPrepared,
  rejectCertificateReq,
  saveCertificate,
  saveCertificateReq,
} from "../controllers/certificatesController.js";
import {
  archiveEmergencyHotlines,
  createEmergencyHotlines,
  editEmergencyHotlines,
  getEmergencyHotlines,
} from "../controllers/emergencyHotlinesController.js";
import {
  createAnnouncement,
  getAnnouncements,
} from "../controllers/announcementController.js";
import {
  approveReservation,
  getReservations,
} from "../controllers/courtController.js";

const router = express.Router();

//SIGN UP
router.post("/checkemployee", checkIfEmployee);
router.post("/checkusername", checkUsername);
router.post("/otp", sendOTP);
router.post("/register", registerUser);

//LOGIN
router.post("/login", loginUser);
router.post("/logout", logoutUser);

//TOKENS
router.get("/checkrefreshtoken", checkRefreshToken);
router.get("/refreshtoken", refreshAccessToken);

//BARANGAY CAPTAIN
router.get("/getcaptain", getCaptain);
router.get("/getemployee/:empID", getEmployee);

//RESIDENTS
router.post("/createresident", createResident);
router.get("/getresidents", authMiddleware, getAllResidents);
router.get("/getresident/:resID", getResident);
router.put("/updateresident/:resID", updateResident);
router.delete("/archiveresident/:resID", archiveResident);
router.get("/getoldresidents", getAllOldResidents);

//EMPLOYEES
router.get("/getemployees", authMiddleware, getAllEmployees);
router.post("/createemployee", createEmployee);
router.get("/positioncount", checkPositions);
router.delete("/archiveemployee/:empID", archiveEmployee);

//USERS
router.get("/getusers", authMiddleware, getAllUsers);
router.get("/getoldusers", getAllOldUsers);
router.post("/createuser", createUser);

//BRGY ID
router.post("/generatebrgyID/:resID", generateBrgyID);
router.put("/savebrgyID/:resID", saveBrgyID);

//EMPLOYEE ID
router.post("/generateemployeeID/:empID", generateEmployeeID);
router.put("/saveemployeeID/:empID", saveEmployeeID);

//CERTIFICATE
router.post("/generatecertificate/", generateCertificate);
router.put("/savecertificate/:certID", saveCertificate);
router.get("/getcertificate/:certID", getCertificate);
router.get("/getprepared/:userID", getPrepared);

//CERTIFICATE REQUESTS
router.get("/getcertificates", getAllCertificateRequests);
router.put("/generatecertificatereq/:certID", generateCertificateReq);
router.put("/savecertificatereq/:certID", saveCertificateReq);
router.put("/rejectcertificatereq/:certID", rejectCertificateReq);

//EMERGENCY HOTLINES
router.get("/getemergencyhotlines", getEmergencyHotlines);
router.post("/createemergencyhotlines", createEmergencyHotlines);
router.post("/editemergencyhotlines/:emergencyID", editEmergencyHotlines);
router.delete(
  "/archiveemergencyhotlines/:emergencyID",
  archiveEmergencyHotlines
);

//ANNOUNCEMENT
router.post("/createannouncement", createAnnouncement);
router.get("/getannouncements", getAnnouncements);

//COURT RESERVATION
router.get("/getreservations", authMiddleware, getReservations);
router.put(
  "/approvereservation/:reservationID",
  authMiddleware,
  approveReservation
);

export default router;
