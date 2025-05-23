import Resident from "../models/Residents.js";
import mongoose from "mongoose";
import OldResident from "../models/OldResidents.js";
import OldUser from "../models/OldUsers.js";
import Employee from "../models/Employees.js";
import User from "../models/Users.js";
import OldEmployee from "../models/OldEmployees.js";
import moment from "moment";
import QRCode from "qrcode";
import {
  getEmployeesUtils,
  getResidentsUtils,
  getUsersUtils,
} from "../utils/collectionUtils.js";
import { rds } from "../index.js";
import axios from "axios";

export const archiveEmployee = async (req, res) => {
  try {
    const { empID } = req.params;
    const employee = await Employee.findById(empID);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (employee.userID) {
      const user = await User.findById(employee.userID);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const archivedUser = new OldUser({
        ...user.toObject(),
        archivedAt: new Date(),
      });
      console.log("User account successfully archived!");
      await archivedUser.save();

      await User.findByIdAndDelete(employee.userID);
    }

    const archivedEmployee = new OldEmployee({
      ...employee.toObject(),
      archivedAt: new Date(),
    });
    await archivedEmployee.save();

    await Resident.updateOne(
      { _id: employee.resID },
      { $unset: { empID: "" } }
    );
    await Employee.findByIdAndDelete(empID);

    console.log("Employee successfully archived!");
    res.status(200).json({ message: "Employee successfully archived" });
  } catch (error) {
    console.log("Error archiving employee", error);
    res.status(500).json({ message: "Failed to archive employee" });
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await getEmployeesUtils();
    res.status(200).json(employees);
  } catch (error) {
    console.log("Error fetching employees", error);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
};

export const archiveResident = async (req, res) => {
  try {
    const { resID } = req.params;
    const resident = await Resident.findById(resID);

    const mother = await Resident.exists({ mother: resID });
    const father = await Resident.exists({ father: resID });
    const spouse = await Resident.exists({ spouse: resID });
    const sibling = await Resident.exists({ siblings: resID });
    const child = await Resident.exists({ children: resID });

    if (mother) {
      await Resident.updateMany({ mother: resID }, { $set: { mother: null } });
      console.log("Removed resident from mother.");
    }
    if (father) {
      await Resident.updateMany({ father: resID }, { $set: { father: null } });
      console.log("Removed resident from father.");
    }
    if (spouse) {
      await Resident.updateMany({ spouse: resID }, { $set: { spouse: null } });
      console.log("Removed resident from spouse.");
    }

    if (sibling) {
      await Resident.updateMany(
        { siblings: resID },
        { $pull: { siblings: resID } }
      );
      console.log("Removed resident from siblings list.");
    }

    if (child) {
      await Resident.updateMany(
        { children: resID },
        { $pull: { children: resID } }
      );
      console.log("Removed resident from children list.");
    }

    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    if (resident.userID) {
      const user = await User.findById(resident.userID);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const archivedUser = new OldUser({
        ...user.toObject(),
        archivedAt: new Date(),
      });
      console.log("User account successfully archived!");
      await archivedUser.save();

      await User.findByIdAndDelete(resident.userID);
    }

    const archivedResident = new OldResident({
      ...resident.toObject(),
      archivedAt: new Date(),
    });
    await archivedResident.save();

    await Resident.findByIdAndDelete(resID);

    console.log("Resident successfully archived!");
    res.status(200).json({ message: "Resident successfully archived" });
  } catch (error) {
    console.log("Error archiving resident", error);
    res.status(500).json({ message: "Failed to archive resident" });
  }
};
export const updateResident = async (req, res) => {
  try {
    const {
      picture,
      signature,
      firstname,
      middlename,
      lastname,
      suffix,
      alias,
      salutation,
      sex,
      gender,
      birthdate,
      birthplace,
      civilstatus,
      bloodtype,
      religion,
      nationality,
      voter,
      precinct,
      deceased,
      email,
      mobilenumber,
      telephone,
      facebook,
      emergencyname,
      emergencymobilenumber,
      emergencyaddress,
      address,
      mother,
      father,
      spouse,
      siblings,
      children,
      HOAname,
      employmentstatus,
      occupation,
      monthlyincome,
      educationalattainment,
      typeofschool,
      course,
    } = req.body;

    const { resID } = req.params;

    const birthDate = moment(birthdate, "YYYY/MM/DD");
    const age = moment().diff(birthDate, "years");

    const resident = await Resident.findOne({ _id: resID });

    const motherAsObjectId = mother
      ? new mongoose.Types.ObjectId(mother)
      : null;
    const fatherAsObjectId = father
      ? new mongoose.Types.ObjectId(father)
      : null;
    const spouseAsObjectId = spouse
      ? new mongoose.Types.ObjectId(spouse)
      : null;

    const siblingsAsObjectIds =
      siblings && siblings.length > 0
        ? siblings.map((siblingId) => new mongoose.Types.ObjectId(siblingId))
        : [];

    const childrenAsObjectIds =
      children && children.length > 0
        ? children.map((childrenId) => new mongoose.Types.ObjectId(childrenId))
        : [];

    resident.picture = picture;
    resident.signature = signature;
    resident.firstname = firstname;
    resident.middlename = middlename;
    resident.lastname = lastname;
    resident.suffix = suffix;
    resident.alias = alias;
    resident.salutation = salutation;
    resident.sex = sex;
    resident.gender = gender;
    resident.birthdate = birthdate;
    resident.age = age;
    resident.birthplace = birthplace;
    resident.civilstatus = civilstatus;
    resident.bloodtype = bloodtype;
    resident.religion = religion;
    resident.nationality = nationality;
    resident.voter = voter;
    resident.precinct = precinct;
    resident.deceased = deceased;
    resident.email = email;
    resident.mobilenumber = mobilenumber;
    resident.telephone = telephone;
    resident.facebook = facebook;
    resident.emergencyname = emergencyname;
    resident.emergencymobilenumber = emergencymobilenumber;
    resident.emergencyaddress = emergencyaddress;
    resident.address = address;
    resident.mother = motherAsObjectId;
    resident.father = fatherAsObjectId;
    resident.spouse = spouseAsObjectId;
    resident.siblings = siblingsAsObjectIds;
    resident.children = childrenAsObjectIds;
    resident.HOAname = HOAname;
    resident.employmentstatus = employmentstatus;
    resident.occupation = occupation;
    resident.monthlyincome = monthlyincome;
    resident.educationalattainment = educationalattainment;
    resident.typeofschool = typeofschool;
    resident.course = course;
    await resident.save();
    console.log("Resident successfully updated!");
    res.status(200).json({ message: "Resident successfully updated" });
  } catch (error) {
    console.log("Error updating resident", error);
    res.status(500).json({ message: "Failed to update resident" });
  }
};

export const getEmployee = async (req, res) => {
  try {
    const { empID } = req.params;
    const employee = await Employee.findOne({ _id: empID }).populate("resID");
    res.status(200).json(employee);
  } catch (error) {
    console.log("Error fetching employee", error);
    res.status(500).json({ message: "Failed to fetch employee" });
  }
};

export const getResident = async (req, res) => {
  try {
    const { resID } = req.params;
    const residents = await Resident.findOne({ _id: resID }).populate("brgyID");
    res.status(200).json(residents);
  } catch (error) {
    console.log("Error fetching residents", error);
    res.status(500).json({ message: "Failed to fetch residents" });
  }
};

export const getCaptain = async (req, res) => {
  try {
    const employee = await Employee.findOne({ position: "Captain" }).populate(
      "resID",
      "firstname middlename lastname signature"
    );
    res.status(200).json(employee);
  } catch (error) {
    console.log("Error fetching barangay captain", error);
    res.status(500).json({ message: "Failed to fetch barangay captain" });
  }
};

export const getAllOldResidents = async (req, res) => {
  try {
    const residents = await OldResident.find();
    res.status(200).json(residents);
  } catch (error) {
    console.log("Error fetching residents", error);
    res.status(500).json({ message: "Failed to fetch residents" });
  }
};

export const getAllResidents = async (req, res) => {
  try {
    const residents = await getResidentsUtils();
    res.status(200).json(residents);
  } catch (error) {
    console.log("Error fetching residents", error);
    res.status(500).json({ message: "Failed to fetch residents" });
  }
};

export const createResident = async (req, res) => {
  try {
    const {
      picture,
      signature,
      firstname,
      middlename,
      lastname,
      suffix,
      alias,
      salutation,
      sex,
      gender,
      birthdate,
      birthplace,
      civilstatus,
      bloodtype,
      religion,
      nationality,
      voter,
      precinct,
      deceased,
      email,
      mobilenumber,
      telephone,
      facebook,
      emergencyname,
      emergencymobilenumber,
      emergencyaddress,
      address,
      mother,
      father,
      spouse,
      siblings,
      children,
      HOAname,
      employmentstatus,
      occupation,
      monthlyincome,
      educationalattainment,
      typeofschool,
      course,
    } = req.body;

    const birthDate = moment(birthdate, "YYYY/MM/DD");
    const age = moment().diff(birthDate, "years");

    const motherAsObjectId = mother
      ? new mongoose.Types.ObjectId(mother)
      : null;
    const fatherAsObjectId = father
      ? new mongoose.Types.ObjectId(father)
      : null;
    const spouseAsObjectId = spouse
      ? new mongoose.Types.ObjectId(spouse)
      : null;

    const siblingsAsObjectIds =
      siblings && siblings.length > 0
        ? siblings.map((siblingId) => new mongoose.Types.ObjectId(siblingId))
        : [];

    const childrenAsObjectIds =
      children && children.length > 0
        ? children.map((childrenId) => new mongoose.Types.ObjectId(childrenId))
        : [];

    const resident = new Resident({
      picture,
      signature,
      firstname,
      middlename,
      lastname,
      suffix,
      alias,
      salutation,
      sex,
      gender,
      birthdate,
      age,
      birthplace,
      civilstatus,
      bloodtype,
      religion,
      nationality,
      voter,
      precinct,
      deceased,
      email,
      mobilenumber,
      telephone,
      facebook,
      emergencyname,
      emergencymobilenumber,
      emergencyaddress,
      address,
      mother: motherAsObjectId,
      father: fatherAsObjectId,
      spouse: spouseAsObjectId,
      siblings: siblingsAsObjectIds,
      children: childrenAsObjectIds,
      HOAname,
      employmentstatus,
      occupation,
      monthlyincome,
      educationalattainment,
      typeofschool,
      course,
    });
    await resident.save();
    console.log("Resident successfully created!");
    res
      .status(200)
      .json({ message: "Resident successfully created", resID: resident._id });
  } catch (error) {
    console.log("Error creating resident", error);
    res.status(500).json({ message: "Failed to create resident" });
  }
};
