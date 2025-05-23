import express from "express";
import {
  archiveEmployee,
  archiveResident,
  createResident,
  getAllEmployees,
  getAllOldResidents,
  getAllResidents,
  getResident,
  updateResident,
  getCaptain,
  getEmployee,
} from "../controllers/infoController.js";

import {
  getAllOldUsers,
  getAllUsers,
  createUser,
  resetPassword,
  deactivateUser,
  activateUser,
  editUser,
} from "../controllers/userController.js";

import {
  checkCredentials,
  checkIfEmployee,
  checkRefreshToken,
  checkUsername,
  deactivatedUser,
  getMobileNumber,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  sendOTP,
  verifyOTP,
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
  archiveAnnouncement,
  createAnnouncement,
  editAnnouncement,
  getAnnouncement,
  getAnnouncements,
  pinAnnouncement,
  unpinAnnouncement,
} from "../controllers/announcementController.js";
import {
  approveReservation,
  createReservation,
  getReservations,
  rejectCourtReq,
} from "../controllers/courtController.js";
import {
  createBlotter,
  editScheduleBlotter,
  getBlotter,
  getBlotters,
  rejectBlotter,
  scheduleBlotter,
  settleBlotter,
} from "../controllers/blotterControllers.js";
import {
  checkOTP,
  checkUser,
  limitOTP,
  newPassword,
  verifySecurityQuestion,
} from "../controllers/forgotPassController.js";
import {
  changePassword,
  changeSecurityQuestions,
  changeUsername,
  getUserDetails,
} from "../controllers/settingsController.js";
import {
  checkPositions,
  checkWeeks,
  createEmployee,
  editEmployee,
} from "../controllers/employeeController.js";
import {
  getAllNotifications,
  markAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

//SIGN UP
router.post("/checkemployee", checkIfEmployee);
router.get("/checkusername/:username", checkUsername);
router.post("/checkcredentials", checkCredentials);
router.post("/sendotp", sendOTP);
router.post("/verifyotp", verifyOTP);
router.post("/register", registerUser);
router.get("/getmobilenumber/:username", getMobileNumber);

//LOGIN
router.put("/login/:username", loginUser);
router.post("/logout", logoutUser);
router.post("/deactivateduser/:userID", deactivatedUser);

//FORGOT PASSWORD
router.get("/checkuser/:username", checkUser);
router.post("/verifyquestion/:username", verifySecurityQuestion);
router.post("/newpassword/:username", newPassword);
router.get("/limitotp/:username", limitOTP);
router.get("/checkotp/:username", checkOTP);

//TOKENS
router.get("/checkrefreshtoken", checkRefreshToken);
router.get("/refreshtoken", refreshAccessToken);

//USERS
router.put("/resetpassword/:username", resetPassword);
router.put("/deactivateuser/:userID", deactivateUser);
router.put("/activateuser/:userID", activateUser);
router.get("/getusers", authMiddleware, getAllUsers);
router.get("/getoldusers", getAllOldUsers);
router.post("/createuser", createUser);
router.put("/edituser/:userID", editUser);

//BARANGAY CAPTAIN
router.get("/getcaptain", getCaptain);
router.get("/getemployee/:empID", getEmployee);

//RESIDENTS
router.post("/createresident", createResident);
router.get("/getresidents", getAllResidents);
router.get("/getresident/:resID", getResident);
router.put("/updateresident/:resID", updateResident);
router.delete("/archiveresident/:resID", archiveResident);
router.get("/getoldresidents", getAllOldResidents);

//EMPLOYEES
router.get("/getemployees", authMiddleware, getAllEmployees);
router.post("/createemployee", createEmployee);
router.get("/positioncount", checkPositions);
router.get("/weekscount", checkWeeks);
router.delete("/archiveemployee/:empID", archiveEmployee);
router.put("/editemployee/:empID", editEmployee);

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
router.get("/getcertificates", authMiddleware, getAllCertificateRequests);
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
router.put("/pinannouncement/:announcementID", authMiddleware, pinAnnouncement);
router.put(
  "/unpinannouncement/:announcementID",
  authMiddleware,
  unpinAnnouncement
);
router.put(
  "/archiveannouncement/:announcementID",
  authMiddleware,
  archiveAnnouncement
);
router.get("/getannouncement/:announcementID", getAnnouncement);
router.post("/editannouncement/:announcementID", editAnnouncement);

//COURT RESERVATION
router.get("/getreservations", authMiddleware, getReservations);
router.put(
  "/approvereservation/:reservationID",
  authMiddleware,
  approveReservation
);
router.post("/createreservation", authMiddleware, createReservation);
router.put(
  "/rejectcourtreservation/:reservationID",
  authMiddleware,
  rejectCourtReq
);

//BLOTTER REPORTS
router.post("/createblotter", authMiddleware, createBlotter);
router.get("/getblotters", getBlotters);
router.get("/getblotter/:blotterID", getBlotter);
router.put("/scheduleblotter/:blotterID", authMiddleware, scheduleBlotter);
router.put(
  "/editscheduleblotter/:blotterID",
  authMiddleware,
  editScheduleBlotter
);
router.put("/settleblotter/:blotterID", authMiddleware, settleBlotter);
router.put("/rejectblotter/:blotterID", authMiddleware, rejectBlotter);

//ACCOUNT SETTINGS
router.get("/getcurrentuser/:userID", getUserDetails);
router.put("/changeusername/:userID", changeUsername);
router.put("/changepassword/:userID", changePassword);
router.put("/changesecurityquestions/:userID", changeSecurityQuestions);

//NOTIFICATIONS
router.get("/getnotifications", authMiddleware, getAllNotifications);
router.put("/readnotification/:notifID", authMiddleware, markAsRead);

export default router;
