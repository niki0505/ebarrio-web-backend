import Resident from "../models/Residents.js";
import mongoose from "mongoose";
import OldResident from "../models/OldResidents.js";
import OldUser from "../models/OldUsers.js";
import Employee from "../models/Employees.js";
import User from "../models/Users.js";
import OldEmployee from "../models/OldEmployees.js";
import Certificate from "../models/Certificates.js";
import moment from "moment";
import QRCode from "qrcode";
import { emitDataUpdated } from "../utils/socketUtils.js";
import { getFormattedCertificates } from "../utils/collectionUtils.js";

export const rejectCertificateReq = async (req, res) => {
  try {
    const { certID } = req.params;
    const { remarks } = req.body;
    console.log(certID);

    const cert = await Certificate.findById(certID);
    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    cert.remarks = remarks;
    cert.status = "Rejected";
    await cert.save();

    return res.status(200).json({
      message: "Certificate is rejected successfully",
    });
  } catch (error) {
    console.error("Error in rejecting certificate:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const saveCertificateReq = async (req, res) => {
  try {
    const { certID } = req.params;
    const { qrCode } = req.body;

    const cert = await Certificate.findById(certID);
    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    cert.certID.qrCode = qrCode;
    await cert.save();

    return res.status(200).json({
      message: "Certificate is saved successfully",
    });
  } catch (error) {
    console.error("Error in saving certificate:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const generateCertificateReq = async (req, res) => {
  try {
    const { certID } = req.params;

    const cert = await Certificate.findById(certID);

    const base10 = BigInt("0x" + cert._id).toString();
    const shortDigits = base10.slice(-10);
    const year = new Date().getFullYear();
    const controlNumber = `${year}${shortDigits}`;

    const expirationDateObj = new Date();
    expirationDateObj.setFullYear(expirationDateObj.getFullYear() + 1);
    const expirationDate = expirationDateObj.toISOString().split("T")[0];

    const qrToken = crypto.randomUUID();
    const qrCodeUrl = `http://localhost:5000/verifyCertificate/${qrToken}`;
    const qrCode = await QRCode.toDataURL(qrCodeUrl);

    cert.certID = {
      controlNumber: controlNumber,
      expirationDate: expirationDate,
      qrCode: qrCode,
      qrToken: qrToken,
    };

    cert.status = "Issued";
    await cert.save();

    return res.status(200).json({
      message: "QR code is generated successfully",
      qrCode,
    });
  } catch (error) {
    console.error("Error in generating certificate:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllCertificateRequests = async (req, res) => {
  try {
    // const certificate = await Certificate.find().populate("resID");
    // const formatDatePH = (date) => {
    //   return new Date(date).toLocaleString("en-PH", {
    //     timeZone: "Asia/Manila",
    //     year: "numeric",
    //     month: "long",
    //     day: "numeric",
    //     hour: "2-digit",
    //     minute: "2-digit",
    //     hour12: true,
    //   });
    // };

    // const formattedCertificates = certificate.map((cert) => ({
    //   ...cert.toObject(),
    //   createdAt: formatDatePH(cert.createdAt),
    // }));
    const formattedCertificates = await getFormattedCertificates();
    res.status(200).json(formattedCertificates);
  } catch (error) {
    console.log("Error fetching certificate requests", error);
    res.status(500).json({ message: "Failed to fetch certificate requests" });
  }
};

export const verifyCertificateQR = async (req, res) => {
  try {
    const { qrToken } = req.params;
    const cert = await Certificate.findOne({
      "certID.qrToken": qrToken,
    }).populate("resID");
    if (!cert) {
      return res.send(`
        <html>
          <head><title>Certificate Verification</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <p style="color: red">
              <strong>INVALID CERTIFICATE</strong> 
            </p>
            <p style="color: gray;">The Certificate you provided is not valid. Please ensure the Certificate is correct or contact the Barangay office for assistance.</p>
          </body>
        </html>
      `);
    }

    const today = new Date().toISOString().split("T")[0];

    const isExpired = today > cert.certID.expirationDate;

    if (isExpired) {
      return res.send(`
        <html>
          <head><title>Certificate Verification</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <p style="color: red">
              <strong>EXPIRED CERTIFICATE</strong> 
            </p>
            <p style="color: gray;">The Certificate you provided is already expired. Please ensure the Certificate is correct or contact the Barangay office for assistance.</p>
          </body>
        </html>
      `);
    } else {
      return res.send(`
        <html>
          <head><title>Certificate Verification</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <p style="color: green">
              <strong>VERIFIED CERTIFICATE</strong> 
            </p>
            <p><strong>Type of Certificate:</strong> ${cert.typeofcertificate}</p>
            <p><strong>Control Number:</strong> ${cert.certID.controlNumber}</p>
            <p><strong>Expiration Date:</strong> ${cert.certID.expirationDate}</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPrepared = async (req, res) => {
  try {
    const { userID } = req.params;
    const userIDasObjectID = new mongoose.Types.ObjectId(userID);
    const user = await User.findById(userIDasObjectID).populate({
      path: "empID",
      populate: {
        path: "resID",
        select: "firstname lastname signature",
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User or Resident not found" });
    }

    const userData = {
      name: `${user.empID.resID.firstname} ${user.empID.resID.lastname}`,
      signature: user.empID.resID.signature,
    };
    res.status(200).json(userData);
  } catch (error) {
    console.log("Error fetching certificate", error);
    res
      .status(500)
      .json({ message: "Failed to fetch certificate", error: error.message });
  }
};

export const getCertificate = async (req, res) => {
  try {
    const { certID } = req.params;
    const cert = await Certificate.findById(certID).populate("resID");

    const formatDatePH = (date) => {
      return new Date(date).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    const formattedCertificate = {
      ...cert.toObject(),
      updatedAt: formatDatePH(cert.updatedAt),
    };
    res.status(200).json(formattedCertificate);
  } catch (error) {
    console.log("Error fetching certificate", error);
    res.status(500).json({ message: "Failed to fetch certificate" });
  }
};

export const saveCertificate = async (req, res) => {
  try {
    const { certID } = req.params;
    const { qrCode } = req.body;
    const cert = await Certificate.findById(certID);
    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    cert.certID.qrCode = qrCode;
    await cert.save();

    return res.status(200).json({
      message: "Certificate is saved successfully",
    });
  } catch (error) {
    console.error("Error in saving certificate:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const generateCertificate = async (req, res) => {
  try {
    const { filteredData, resID } = req.body;

    const tempcert = new Certificate();

    const base10 = BigInt("0x" + tempcert._id).toString();
    const shortDigits = base10.slice(-10);
    const year = new Date().getFullYear();
    const controlNumber = `${year}${shortDigits}`;

    const expirationDateObj = new Date();
    expirationDateObj.setFullYear(expirationDateObj.getFullYear() + 1);
    const expirationDate = expirationDateObj.toISOString().split("T")[0];

    const qrToken = crypto.randomUUID();
    const qrCodeUrl = `http://localhost:5000/verifyCertificate/${qrToken}`;
    const qrCode = await QRCode.toDataURL(qrCodeUrl);

    const cert = new Certificate({
      _id: tempcert._id,
      ...filteredData,
      resID,
      certID: {
        controlNumber,
        expirationDate,
        qrCode,
        qrToken,
      },
    });

    await cert.save();

    const formatDatePH = (date) => {
      return new Date(date).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    return res.status(200).json({
      message: "QR code is generated successfully",
      qrCode,
      certID: cert._id,
      createdAt: formatDatePH(cert.createdAt),
    });
  } catch (error) {
    console.error("Error in generating barangay ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
