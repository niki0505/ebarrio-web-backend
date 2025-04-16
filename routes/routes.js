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

const router = express.Router();

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
router.get("/getemployees", getAllEmployees);
router.post("/createemployee", createEmployee);
router.get("/positioncount", checkPositions);
router.delete("/archiveemployee/:empID", archiveEmployee);

//USERS
router.get("/getusers", getAllUsers);
router.get("/getoldusers", getAllOldUsers);
router.post("/createuser", createUser);

//SIGN UP
router.post("/checkemployee", checkIfEmployee);
router.post("/checkusername", checkUsername);
router.post("/otp", sendOTP);
router.post("/register", registerUser);

//LOGIN
router.post("/login", loginUser);
router.post("/logout", logoutUser);

//BRGY ID
router.post("/generatebrgyID/:resID", generateBrgyID);
router.put("/savebrgyID/:resID", saveBrgyID);

//EMPLOYEE ID
router.post("/generateemployeeID/:empID", generateEmployeeID);
router.put("/saveemployeeID/:empID", saveEmployeeID);

//SESSION
router.get("/checkrefreshtoken", checkRefreshToken);
router.get("/refreshtoken", refreshAccessToken);

export default router;
