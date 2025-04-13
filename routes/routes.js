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
} from "../controllers/infoController.js";

const router = express.Router();

//RESIDENTS
router.post("/createresident", createResident);
router.get("/getresidents", getAllResidents);
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

export default router;
