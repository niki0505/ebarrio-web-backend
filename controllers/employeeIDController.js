import Resident from "../models/Residents.js";
import mongoose from "mongoose";
import OldResident from "../models/OldResidents.js";
import OldUser from "../models/OldUsers.js";
import Employee from "../models/Employees.js";
import User from "../models/Users.js";
import OldEmployee from "../models/OldEmployees.js";
import moment from "moment";
import QRCode from "qrcode";

export const verifyEmployeeQR = async (req, res) => {
  try {
    const { qrToken } = req.params;
    const employee = await Employee.findOne({
      "employeeID.qrToken": qrToken,
    }).populate("resID");
    if (!employee) {
      return res.send(`
        <html>
          <head><title>Employee ID Verification</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <p style="color: red">
              <strong>INVALID EMPLOYEE ID</strong> 
            </p>
            <p style="color: gray;">The Employee ID you provided is not valid. Please ensure the ID is correct or contact the Barangay office for assistance.</p>
          </body>
        </html>
      `);
    }

    const employeeInfo = employee.employeeID.find(
      (id) => id.qrToken === qrToken
    );
    const today = new Date().toISOString().split("T")[0];

    const isExpired = today > employeeInfo.expirationDate;

    if (isExpired) {
      return res.send(`
        <html>
          <head><title>Employee ID Verification</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <p style="color: red">
              <strong>EXPIRED EMPLOYEE ID</strong> 
            </p>
            <p style="color: gray;">The Employee ID you provided is already expired. Please ensure the ID is correct or contact the Barangay office for assistance.</p>
          </body>
        </html>
      `);
    } else {
      return res.send(`
        <html>
          <head><title>Employee ID Verification</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <p style="color: green">
              <strong>VERIFIED EMPLOYEE</strong> 
            </p>
            <img style="width: 300px; height: 400px" src=${employee.resID.picture}/>
            <p><strong>Name:</strong> ${employee.resID.firstname} ${employee.resID.lastname}</p>
            <p><strong>Position:</strong> ${employee.position}</p>
            <p><strong>Address</strong> ${employee.resID.address}</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const saveEmployeeID = async (req, res) => {
  try {
    const { empID } = req.params;
    const { idNumber, expirationDate, qrCode, qrToken } = req.body;
    const employee = await Employee.findById(empID);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.employeeID = [];
    employee.employeeID.push({
      idNumber,
      expirationDate,
      qrCode,
      qrToken,
    });

    await employee.save();

    return res.status(200).json({
      message: "Employee ID is saved successfully",
    });
  } catch (error) {
    console.error("Error in saving employee ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const generateEmployeeID = async (req, res) => {
  try {
    const { empID } = req.params;
    const employee = await Employee.findById(empID);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const base10 = BigInt("0x" + employee._id).toString();
    const shortDigits = base10.slice(-10);
    const year = new Date().getFullYear();
    const idNumber = `${year}${shortDigits}`;

    const expirationDateObj = new Date();
    expirationDateObj.setFullYear(expirationDateObj.getFullYear() + 1);
    const expirationDate = expirationDateObj.toISOString().split("T")[0];

    const qrToken = crypto.randomUUID();
    const qrCodeUrl = `http://localhost:5000/verifyEmployee/${qrToken}`;
    const qrCode = await QRCode.toDataURL(qrCodeUrl);

    return res.status(200).json({
      message: "QR code is generated successfully",
      qrCode,
      idNumber,
      expirationDate,
      qrToken,
    });
  } catch (error) {
    console.error("Error in generating employee ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
