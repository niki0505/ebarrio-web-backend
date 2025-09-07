import Resident from "../models/Residents.js";
import mongoose from "mongoose";
import User from "../models/Users.js";
import Certificate from "../models/Certificates.js";
import QRCode from "qrcode";
import {
  getFormattedCertificates,
  getPendingDocuments,
  sendNotificationUpdate,
  sendPushNotification,
} from "../utils/collectionUtils.js";
import Notification from "../models/Notifications.js";
const bgUrl = "https://api.ebarrio.online/qr-bg.png";
const aniban2logoUrl = "https://api.ebarrio.online/aniban2logo.jpg";
const verifiedUrl = "https://api.ebarrio.online/verified.png";
import ActivityLog from "../models/ActivityLogs.js";

export const getPendingDocumentsCount = async (req, res) => {
  try {
    const cert = await getPendingDocuments();
    return res.status(200).json(cert);
  } catch (error) {
    console.error("Backend image error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const collectedCert = async (req, res) => {
  try {
    const { userID } = req.user;
    const { certID } = req.params;

    const cert = await Certificate.findById(certID).populate({
      path: "resID",
      select: "_id",
    });

    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    cert.status = "Collected";

    await cert.save();

    const user = await User.findOne({ resID: cert.resID._id }).populate({
      path: "resID",
      select: "firstname lastname",
    });

    const io = req.app.get("socketio");
    io.to(user._id.toString()).emit("certificateUpdate", {
      title: `📄 ${cert.typeofcertificate} Collected`,
      message: `Your document has been collected. Thank you for your time.`,
      timestamp: cert.updatedAt,
    });

    if (user?.pushtoken) {
      await sendPushNotification(
        user.pushtoken,
        `📄 ${cert.typeofcertificate} Collected`,
        `Your document has been collected. Thank you for your time.`,
        "Status"
      );
    } else {
      console.log("⚠️ No push token found for user:", user.username);
    }

    await Notification.insertOne({
      userID: user._id,
      title: `📄 ${cert.typeofcertificate} Collected`,
      message: `Your document has been collected. Thank you for your time.`,
      redirectTo: "Status",
    });

    await ActivityLog.insertOne({
      userID,
      action: "Update",
      target: "Document Requests",
      description: `User marked the ${cert.typeofcertificate.toLowerCase()} request of ${
        user.resID.lastname
      }, ${user.resID.firstname} as collected.`,
    });

    return res.status(200).json({
      message:
        "Resident has been successfully notified about the document availability",
    });
  } catch (error) {
    console.error("Error in notifying resident:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const notifyCert = async (req, res) => {
  try {
    const { userID } = req.user;
    const { certID } = req.params;

    const cert = await Certificate.findById(certID).populate({
      path: "resID",
      select: "_id",
    });

    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    const user = await User.findOne({ resID: cert.resID._id }).populate({
      path: "resID",
      select: "firstname lastname",
    });

    const io = req.app.get("socketio");
    io.to(user._id.toString()).emit("certificateUpdate", {
      title: `📄 ${cert.typeofcertificate} Issued`,
      message: `Your document request has been processed and is now available for pick up at the barangay hall. Kindly pay the fee of ${cert.amount} upon claiming.`,
      timestamp: cert.updatedAt,
    });

    if (user?.pushtoken) {
      await sendPushNotification(
        user.pushtoken,
        `📄 ${cert.typeofcertificate} Issued`,
        `Your document request has been processed and is now available for pick up at the barangay hall. Kindly pay the fee of ${cert.amount} upon claiming.`,
        "Status"
      );
    } else {
      console.log("⚠️ No push token found for user:", user.username);
    }

    await Notification.insertOne({
      userID: user._id,
      title: `📄 ${cert.typeofcertificate} Issued`,
      message: `Your document request has been processed and is now available for pick up at the barangay hall. Kindly pay the fee of ${cert.amount} upon claiming.`,
      redirectTo: "Status",
    });

    await ActivityLog.insertOne({
      userID,
      action: "Notify",
      target: "Document Requests",
      description: `User notified ${user.resID.lastname}, ${
        user.resID.firstname
      } about their ${cert.typeofcertificate.toLowerCase()} request being available for pickup.`,
    });

    return res.status(200).json({
      message:
        "Resident has been successfully notified about the document availability",
    });
  } catch (error) {
    console.error("Error in notifying resident:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectCertificateReq = async (req, res) => {
  try {
    const { userID } = req.user;
    const { certID } = req.params;
    const { remarks } = req.body;

    const cert = await Certificate.findById(certID);

    const resident = await Resident.findById(cert.resID);

    const user = await User.findById(resident.userID);
    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    cert.remarks = remarks;
    cert.status = "Rejected";
    await cert.save();

    const io = req.app.get("socketio");
    io.to(user._id.toString()).emit("certificateUpdate", {
      title: `❌ ${cert.typeofcertificate} Rejected`,
      message: `Your document request has been rejected. Kindly see the remarks for the reason.`,
      timestamp: cert.updatedAt,
    });

    if (user?.pushtoken) {
      await sendPushNotification(
        user.pushtoken,
        `❌ ${cert.typeofcertificate} Rejected`,
        `Your document request has been rejected. Kindly see the remarks for the reason.`,
        "Status"
      );
    } else {
      console.log("⚠️ No push token found for user:", user.username);
    }

    await Notification.insertOne({
      userID: user._id,
      title: `❌ ${cert.typeofcertificate} Rejected`,
      message: `Your document request has been rejected. Kindly see the remarks for the reason.`,
      redirectTo: "Status",
    });

    sendNotificationUpdate(user._id.toString(), io);

    await ActivityLog.insertOne({
      userID,
      action: "Reject",
      target: "Document Requests",
      description: `User rejected the ${cert.typeofcertificate.toLowerCase()} request of ${
        resident.lastname
      }, ${resident.firstname}.`,
    });

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
    const { userID } = req.user;
    const { certID } = req.params;
    const { qrCode } = req.body;

    const cert = await Certificate.findById(certID).populate({
      path: "resID",
      select: "firstname lastname",
    });
    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    cert.certID.qrCode = qrCode;
    await cert.save();

    await ActivityLog.insertOne({
      userID,
      action: "Approve",
      target: "Document Requests",
      description: `User approved the ${cert.typeofcertificate.toLowerCase()} request of ${
        cert.resID.lastname
      }, ${cert.resID.firstname}.`,
    });

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

    const resident = await Resident.findById(cert.resID);

    const user = await User.findById(resident.userID);

    const base10 = BigInt("0x" + cert._id).toString();
    const shortDigits = base10.slice(-10);
    const year = new Date().getFullYear();
    const controlNumber = `${year}${shortDigits}`;

    const expirationDateObj = new Date();
    expirationDateObj.setFullYear(expirationDateObj.getFullYear() + 1);
    const expirationDate = expirationDateObj.toISOString().split("T")[0];

    const qrToken = crypto.randomUUID();
    const qrCodeUrl = `https://api.ebarrio.online/verifyCertificate/${qrToken}`;
    const qrCode = await QRCode.toDataURL(qrCodeUrl);

    cert.certID = {
      controlNumber: controlNumber,
      expirationDate: expirationDate,
      qrCode: qrCode,
      qrToken: qrToken,
    };

    cert.status = "Not Yet Collected";
    await cert.save();

    const io = req.app.get("socketio");
    io.to(user._id).emit("certificateUpdate", {
      title: `📄 ${cert.typeofcertificate} Issued`,
      message: `Your document request has been processed and is now available for pick up at the barangay hall. Kindly pay the fee of ${cert.amount} upon claiming.`,
      timestamp: cert.updatedAt,
    });

    if (user?.pushtoken) {
      await sendPushNotification(
        user.pushtoken,
        `📄 ${cert.typeofcertificate} Issued`,
        `Your document request has been processed and is now available for pick up at the barangay hall. Kindly pay the fee of ${cert.amount} upon claiming.`,
        "Status"
      );
    } else {
      console.log("⚠️ No push token found for user:", user.username);
    }

    await Notification.insertOne({
      userID: user._id,
      title: `📄 ${cert.typeofcertificate} Issued`,
      message: `Your document request has been processed and is now available for pick up at the barangay hall. Kindly pay the fee of ${cert.amount} upon claiming.`,
      redirectTo: "Status",
    });

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
      <head>
        <title>Certificate Verification</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            font-family: sans-serif;
            text-align: center;
          }
        </style>
      </head>
      <body
       style="
        margin: 0;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        font-family: sans-serif;
        text-align: center;
        background-image: url('${bgUrl}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        display: flex;
        justify-content: center;
        align-items: center;
      "
      >
        <div
          style="
            background-color: rgba(255, 255, 255, 1);
            display: inline-block;
            padding: 20px 40px;
            border-radius: 10px;
            width: 30%;
            max-height: 100%;
          
          "
        >
          <p style="color: black; font-size: 20px;"><strong>Barangay Management System</strong></p>

          <div
            style="display: flex; flex-direction: row; justify-content: center; align-items: center; width: 100%; gap: 20px;"
          >
            <img style="width: 80px; height: 80px;" src="${aniban2logoUrl}" />

          </div>

          <p style="color: red"><strong>INVALID CERTIFICATE</strong></p>
          <hr style="width: 100%; border: 1px solid red;" />
          
           <p style="color: gray;">The Certificate you provided is not valid. Please ensure the Certificate is correct or contact the Barangay office for assistance.</p>
        </div>
      </body>
    </html>
      `);
    }

    const today = new Date().toISOString().split("T")[0];

    const isExpired = today > cert.certID.expirationDate;

    if (isExpired) {
      return res.send(`
          <html>
      <head>
        <title>Certificate Verification</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            font-family: sans-serif;
            text-align: center;
          }
        </style>
      </head>
      <body
        style="
        margin: 0;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        font-family: sans-serif;
        text-align: center;
        background-image: url('${bgUrl}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        display: flex;
        justify-content: center;
        align-items: center;
      "
      >
        <div
          style="
            background-color: rgba(255, 255, 255, 1);
            display: inline-block;
            padding: 20px 40px;
            border-radius: 10px;
            width: 30%;
            max-height: 100%;
          
          "
        >
          <p style="color: black; font-size: 20px;"><strong>Barangay Management System</strong></p>

          <div
            style="display: flex; flex-direction: row; justify-content: center; align-items: center; width: 100%; gap: 20px;"
          >
            <img style="width: 80px; height: 80px;" src="${aniban2logoUrl}" />

          </div>

          <p style="color: red"><strong>EXPIRED CERTIFICATE</strong> </p>
          <hr style="width: 100%; border: 1px solid red;" />
          
           <p style="color: gray;">The Certificate you provided is already expired. Please ensure the Certificate is correct or contact the Barangay office for assistance.</p>
        </div>
      </body>
    </html>

      `);
    } else {
      return res.send(`
        <html>
      <head>
        <title>Certificate Verification</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            font-family: sans-serif;
            text-align: center;
          }
        </style>
      </head>
      <body
      style="
        margin: 0;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        font-family: sans-serif;
        text-align: center;
        background-image: url('${bgUrl}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        display: flex;
        justify-content: center;
        align-items: center;
      "
      >
        <div
          style="
            background-color: rgba(255, 255, 255, 1);
            display: inline-block;
            padding: 20px 40px;
            border-radius: 10px;
            width: 30%;
            max-height: 100%;
          "
        >
          <p style="color: black; font-size: 20px;"><strong>Barangay Management System</strong></p>

          <div
            style="display: flex; flex-direction: row; justify-content: center; align-items: center; width: 100%; gap: 20px;"
          >
            <img style="width: 80px; height: 80px;" src="${aniban2logoUrl}" />
            <img style="width: 100px; height: 100px;" src="${verifiedUrl}" />
          </div>

          <p style="color: green"><strong>VERIFIED CERTIFICATE</strong></p>
          <hr style="width: 100%; border: 1px solid green;" />

          <p style="font-size: 14px; text-transform: uppercase;">
            <strong>Name:</strong> ${cert.typeofcertificate}
          </p>
          <p style="font-size: 14px; text-transform: uppercase;">
            <strong>Control No:</strong> ${cert.certID.controlNumber}
          </p>
          <p style="font-size: 14px; text-transform: uppercase;">
            <strong>Address:</strong> ${cert.certID.expirationDate}
          </p>
        </div>
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
    const cert = await Certificate.findById(certID).populate({
      path: "resID",
      populate: {
        path: "householdno",
        select: "address",
      },
    });

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
    const { userID } = req.user;
    const { certID } = req.params;
    const { qrCode } = req.body;
    const cert = await Certificate.findById(certID);
    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    cert.certID.qrCode = qrCode;
    await cert.save();

    await ActivityLog.insertOne({
      userID,
      action: "Generate",
      target: "Document Requests",
      description: `User generated a ${cert.typeofcertificate.toLowerCase()} for ${
        cert.resID.lastname
      }, ${cert.resID.firstname}.`,
    });
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
    const qrCodeUrl = `https://api.ebarrio.online/verifyCertificate/${qrToken}`;
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
