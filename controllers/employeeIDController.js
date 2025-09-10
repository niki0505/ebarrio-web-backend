import ActivityLog from "../models/ActivityLogs.js";
import Employee from "../models/Employees.js";
import QRCode from "qrcode";
const bgUrl = "https://api.ebarrio.online/qr-bg.png";
const aniban2logoUrl = "https://api.ebarrio.online/aniban2logo.jpg";
const verifiedUrl = "https://api.ebarrio.online/verified.png";

export const verifyEmployeeQR = async (req, res) => {
  try {
    const { qrToken } = req.params;
    const employee = await Employee.findOne({
      "employeeID.qrToken": qrToken,
    }).populate("resID");
    if (!employee) {
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

          <p style="color: red"><strong>INVALID EMPLOYEE ID</strong></p>
          <hr style="width: 100%; border: 1px solid red;" />
          
          <p style="color: gray;">The Employee ID you provided is not valid. Please ensure the ID is correct or contact the Barangay office for assistance.</p>
        </div>
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

          <p style="color: red"><strong>EXPIRED EMPLOYEE ID</strong></p>
          <hr style="width: 100%; border: 1px solid red;" />
          
           <p style="color: gray;">The Employee ID you provided is already expired. Please ensure the ID is correct or contact the Barangay office for assistance.</p>
        </div>
      </body>
    </html>
      `);
    } else {
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

          <p style="color: green"><strong>VERIFIED EMPLOYEE</strong></p>
          <hr style="width: 100%; border: 1px solid green;" />

          <img
            style="width: 160px; height: 160px; border-radius: 10px;"
            src="${employee.resID.picture}"
          />
          <p style="font-size: 14px; text-transform: uppercase;">
            <strong>Name:</strong> ${employee.resID.firstname} ${employee.resID.lastname}
          </p>
          <p style="font-size: 14px; text-transform: uppercase;">
            <strong>Position:</strong> ${employee.position}
          </p>
          <p style="font-size: 14px; text-transform: uppercase;">
            <strong>Address:</strong> ${employee.resID.address}
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

export const saveEmployeeID = async (req, res) => {
  try {
    const { userID } = req.user;
    const { empID } = req.params;
    const { idNumber, expirationDate, qrCode, qrToken } = req.body;
    const employee = await Employee.findById(empID).populate({
      path: "resID",
      select: "firstname lastname",
    });
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

    await ActivityLog.insertOne({
      userID,
      action: "Generate",
      target: "Employees",
      description: `User generated a new employee ID of ${employee.resID.lastname}, ${employee.resID.firstname}.`,
    });

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
    const qrCodeUrl = `https://api.ebarrio.online/verifyEmployee/${qrToken}`;
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
