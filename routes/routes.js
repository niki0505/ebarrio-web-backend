import express from "express";
import {
  createResident,
  getAllEmployees,
  getAllOldResidents,
  getAllResidents,
  getResident,
  updateResident,
  getCaptain,
  getEmployee,
  logExport,
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
  archivedUser,
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
  updatedUser,
  verifyOTP,
} from "../controllers/authController.js";
import { generateBrgyID, saveBrgyID } from "../controllers/brgyIDController.js";
import {
  generateEmployeeID,
  saveEmployeeID,
} from "../controllers/employeeIDController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  collectedCert,
  generateCertificate,
  generateCertificateReq,
  getAllCertificateRequests,
  getCertificate,
  getPrepared,
  notifyCert,
  rejectCertificateReq,
  saveCertificate,
  saveCertificateReq,
} from "../controllers/certificatesController.js";
import {
  archiveEmergencyHotlines,
  createEmergencyHotlines,
  editEmergencyHotlines,
  getEmergencyHotlines,
  recoverEmergencyHotlines,
} from "../controllers/emergencyHotlinesController.js";
import {
  archiveAnnouncement,
  createAnnouncement,
  editAnnouncement,
  getAnnouncement,
  getAnnouncements,
  pinAnnouncement,
  recoverAnnouncement,
  unpinAnnouncement,
} from "../controllers/announcementController.js";
import {
  approveReservation,
  createReservation,
  getPendingReservations,
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
  archiveEmployee,
  checkPositions,
  checkWeeks,
  createEmployee,
  editEmployee,
  recoverEmployee,
} from "../controllers/employeeController.js";
import {
  getAllNotifications,
  markAllAsRead,
  markAsRead,
} from "../controllers/notificationController.js";
import {
  archiveResident,
  issueDocument,
  printBrgyID,
  recoverResident,
  viewResidentDetails,
  approveResident,
  getResidentImages,
  rejectResident,
} from "../controllers/residentsController.js";
import { getLogs } from "../controllers/activityLogsController.js";
import {
  addMember,
  addVehicle,
  editPosition,
  editVehicle,
  getAllHousehold,
  getHousehold,
  removeMember,
} from "../controllers/householdController.js";
import { getLatestSnapshot } from "../controllers/snapshotController.js";
import { createFAQ, getFAQs } from "../controllers/chatController.js";

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
router.post("/archiveduser/:userID", archivedUser);
router.post("/updateduser", authMiddleware, updatedUser);

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
router.put("/deactivateuser/:userID", authMiddleware, deactivateUser);
router.put("/activateuser/:userID", authMiddleware, activateUser);
router.get("/getusers", authMiddleware, getAllUsers);
router.get("/getoldusers", getAllOldUsers);
router.post("/createuser", authMiddleware, createUser);
router.put("/edituser/:userID", authMiddleware, editUser);

//BARANGAY CAPTAIN
router.get("/getcaptain", authMiddleware, getCaptain);
router.get("/getemployee/:empID", authMiddleware, getEmployee);

//RESIDENTS
router.post("/createresident", authMiddleware, createResident);
router.get("/getresidents", authMiddleware, getAllResidents);
router.get("/getresident/:resID", authMiddleware, getResident);
router.put("/updateresident/:resID", authMiddleware, updateResident);
router.put("/archiveresident/:resID", authMiddleware, archiveResident);
router.put("/recoverresident/:resID", authMiddleware, recoverResident);
router.get("/getoldresidents", getAllOldResidents);
router.post("/viewresidentdetails/:resID", authMiddleware, viewResidentDetails);
router.post("/printcurrentbrgyid/:resID", authMiddleware, printBrgyID);
router.post("/issuedocument/:resID", authMiddleware, issueDocument);

//EMPLOYEES
router.get("/getemployees", authMiddleware, getAllEmployees);
router.post("/createemployee", authMiddleware, createEmployee);
router.get("/positioncount", authMiddleware, checkPositions);
router.get("/weekscount", checkWeeks);
router.put("/archiveemployee/:empID", authMiddleware, archiveEmployee);
router.put("/editemployee/:empID", authMiddleware, editEmployee);
router.put("/recoveremployee/:empID", authMiddleware, recoverEmployee);

//BRGY ID
router.post("/generatebrgyID/:resID", authMiddleware, generateBrgyID);
router.put("/savebrgyID/:resID", authMiddleware, saveBrgyID);

//EMPLOYEE ID
router.post("/generateemployeeID/:empID", authMiddleware, generateEmployeeID);
router.put("/saveemployeeID/:empID", authMiddleware, saveEmployeeID);

//CERTIFICATE
router.post("/generatecertificate/", authMiddleware, generateCertificate);
router.put("/savecertificate/:certID", authMiddleware, saveCertificate);
router.get("/getcertificate/:certID", authMiddleware, getCertificate);
router.get("/getprepared/:userID", authMiddleware, getPrepared);

//CERTIFICATE REQUESTS
router.get("/getcertificates", authMiddleware, getAllCertificateRequests);
router.put(
  "/generatecertificatereq/:certID",
  authMiddleware,
  generateCertificateReq
);
router.put("/savecertificatereq/:certID", authMiddleware, saveCertificateReq);
router.put(
  "/rejectcertificatereq/:certID",
  authMiddleware,
  rejectCertificateReq
);

router.put("/notifycert/:certID", authMiddleware, notifyCert);
router.put("/collectedcert/:certID", authMiddleware, collectedCert);

//EMERGENCY HOTLINES
router.get("/getemergencyhotlines", authMiddleware, getEmergencyHotlines);
router.post(
  "/createemergencyhotlines",
  authMiddleware,
  createEmergencyHotlines
);
router.post(
  "/editemergencyhotlines/:emergencyID",
  authMiddleware,
  editEmergencyHotlines
);
router.put(
  "/archiveemergencyhotlines/:emergencyID",
  authMiddleware,
  archiveEmergencyHotlines
);
router.put(
  "/recoveremergencyhotlines/:emergencyID",
  authMiddleware,
  recoverEmergencyHotlines
);

//ANNOUNCEMENT
router.post("/createannouncement", authMiddleware, createAnnouncement);
router.get("/getannouncements", authMiddleware, getAnnouncements);
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
router.put(
  "/recoverannouncement/:announcementID",
  authMiddleware,
  recoverAnnouncement
);
router.get("/getannouncement/:announcementID", authMiddleware, getAnnouncement);
router.post(
  "/editannouncement/:announcementID",
  authMiddleware,
  editAnnouncement
);

//COURT RESERVATION
router.get("/getreservations", authMiddleware, getReservations);
router.get("/getpendingreservations", authMiddleware, getPendingReservations);
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
router.get("/getblotters", authMiddleware, getBlotters);
router.get("/getblotter/:blotterID", authMiddleware, getBlotter);
router.put("/scheduleblotter/:blotterID", authMiddleware, scheduleBlotter);
router.put(
  "/editscheduleblotter/:blotterID",
  authMiddleware,
  editScheduleBlotter
);
router.put("/settleblotter/:blotterID", authMiddleware, settleBlotter);
router.put("/rejectblotter/:blotterID", authMiddleware, rejectBlotter);

//ACCOUNT SETTINGS
router.get("/getcurrentuser/:userID", authMiddleware, getUserDetails);
router.put("/changeusername/:userID", authMiddleware, changeUsername);
router.put("/changepassword/:userID", authMiddleware, changePassword);
router.put(
  "/changesecurityquestions/:userID",
  authMiddleware,
  changeSecurityQuestions
);

//NOTIFICATIONS
router.get("/getnotifications", authMiddleware, getAllNotifications);
router.put("/readnotification/:notifID", authMiddleware, markAsRead);
router.put("/readnotifications", authMiddleware, markAllAsRead);

//ACTIVITY LOGS
router.get("/getactivitylogs", authMiddleware, getLogs);

//EXPORT
router.post("/logexport", authMiddleware, logExport);

//HOUSEHOLD
router.get("/gethouseholds", authMiddleware, getAllHousehold);
router.get("/gethousehold/:householdID", authMiddleware, getHousehold);
router.put(
  "/household/:householdID/member/:memberID",
  authMiddleware,
  editPosition
);
router.put(
  "/household/:householdID/vehicle/:vehicleID",
  authMiddleware,
  editVehicle
);
router.post("/household/:householdID/member", authMiddleware, addMember);
router.post("/household/:householdID/vehicle", authMiddleware, addVehicle);
router.delete(
  "/household/:householdID/member/:memberID",
  authMiddleware,
  removeMember
);

router.post("/approveresident/:resID/", authMiddleware, approveResident);
router.get("/getresidentimages/:resID/", authMiddleware, getResidentImages);
router.post("/rejectresident/:resID", authMiddleware, rejectResident);

//RIVER SNAPSHOTS
router.get("/latestsnapshot", getLatestSnapshot);

//FAQs
router.post("/createfaq", authMiddleware, createFAQ);
router.get("/getfaqs", authMiddleware, getFAQs);
export default router;
