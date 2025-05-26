import Resident from "../models/Residents.js";
import QRCode from "qrcode";

export const verifyQR = async (req, res) => {
  try {
    const { qrToken } = req.params;
    const resident = await Resident.findOne({ "brgyID.qrToken": qrToken });
    if (!resident) {
      return res.send(`
        <html>
          <head><title>Barangay ID Verification</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <p style="color: red">
              <strong>INVALID BARANGAY ID</strong> 
            </p>
            <p style="color: gray;">The Barangay ID you provided is not valid. Please ensure the ID is correct or contact the Barangay office for assistance.</p>
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
          <head><title>Barangay ID Verification</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <p style="color: red">
              <strong>EXPIRED BARANGAY ID</strong> 
            </p>
            <p style="color: gray;">The Barangay ID you provided is already expired. Please ensure the ID is correct or contact the Barangay office for assistance.</p>
          </body>
        </html>
      `);
    } else {
      return res.send(`
        <html>
          <head><title>Barangay ID Verification</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <p style="color: green">
              <strong>VERIFIED RESIDENT</strong> 
            </p>
            <img style="width: 300px; height: 400px" src=${resident.picture}/>
            <p><strong>Name:</strong> ${resident.firstname} ${resident.lastname}</p>
            <p><strong>Address</strong> ${resident.address}</p>
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
