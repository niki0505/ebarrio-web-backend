import Resident from "../models/Residents.js";
import QRCode from "qrcode";
const bgUrl = "http://localhost:5000/qr-bg.png";
const aniban2logoUrl = "http://localhost:5000/aniban2logo.jpg";
const verifiedUrl = "http://localhost:5000/verified.png";

export const verifyQR = async (req, res) => {
  try {
    const { qrToken } = req.params;
    const resident = await Resident.findOne({ "brgyID.qrToken": qrToken });
    if (!resident) {
      return res.send(`
        <html>
      <head>
        <title>Employee ID Verification</title>
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
        background-size: contain;
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

          <p style="color: red"><strong>INVALID BARANGAY ID</strong></p>
          <hr style="width: 100%; border: 1px solid red;" />
          
          <p style="color: gray;">The Barangay ID you provided is not valid. Please ensure the ID is correct or contact the Barangay office for assistance.</p>
        </div>
      </body>
    </html>
      `);
    }

    const brgyInfo = resident.brgyID.find((id) => id.qrToken === qrToken);
    const today = new Date().toISOString().split("T")[0];

    const isExpired = today > brgyInfo.expirationDate;

    if (isExpired) {
      return res.send(`
        <html>
      <head>
        <title>Employee ID Verification</title>
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
        background-size: contain;
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

          <p style="color: red"><strong>EXPIRED BARANGAY ID</strong></p>
          <hr style="width: 100%; border: 1px solid red;" />
          
           <p style="color: gray;">The Barangay ID you provided is already expired. Please ensure the ID is correct or contact the Barangay office for assistance.</p>
        </div>
      </body>
    </html>
      `);
    } else {
      return res.send(`
         <html>
      <head>
        <title>Barangay ID Verification</title>
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
        background-size: contain;
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

          <p style="color: green"><strong>VERIFIED RESIDENT</strong></p>
          <hr style="width: 100%; border: 1px solid green;" />

          <img
            style="width: 160px; height: 160px; border-radius: 10px;"
            src=${resident.picture}"
          />
          <p style="font-size: 14px; text-transform: uppercase;">
            <strong>Position:</strong> ${resident.firstname} ${resident.lastname}
          </p>
          <p style="font-size: 14px; text-transform: uppercase;">
            <strong>Address:</strong> ${resident.address}
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

export const saveBrgyID = async (req, res) => {
  try {
    const { resID } = req.params;
    const { userID } = req.user;
    const { idNumber, expirationDate, qrCode, qrToken } = req.body;
    const resident = await Resident.findById(resID);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    resident.brgyID = [];
    resident.brgyID.push({
      idNumber,
      expirationDate,
      qrCode,
      qrToken,
    });

    await resident.save();

    await ActivityLog.insertOne({
      userID: userID,
      action: "Residents",
      description: `User generated a new barangay ID of ${resident.lastname}, ${resident.firstname}.`,
    });

    return res.status(200).json({
      message: "Barangay ID is saved successfully",
    });
  } catch (error) {
    console.error("Error in saving barangay ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const generateBrgyID = async (req, res) => {
  try {
    const { resID } = req.params;
    const resident = await Resident.findById(resID);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }
    const base10 = BigInt("0x" + resident._id).toString();
    const shortDigits = base10.slice(-10);
    const year = new Date().getFullYear();
    const idNumber = `${year}${shortDigits}`;

    const expirationDateObj = new Date();
    expirationDateObj.setFullYear(expirationDateObj.getFullYear() + 1);
    const expirationDate = expirationDateObj.toISOString().split("T")[0];

    const qrToken = crypto.randomUUID();
    const qrCodeUrl = `http://localhost:5000/verifyResident/${qrToken}`;
    const qrCode = await QRCode.toDataURL(qrCodeUrl);

    return res.status(200).json({
      message: "QR code is generated successfully",
      qrCode,
      idNumber,
      expirationDate,
      qrToken,
    });
  } catch (error) {
    console.error("Error in generating barangay ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
