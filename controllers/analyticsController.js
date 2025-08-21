// controllers/analyticsController.js
import axios from "axios";
import Resident from "../models/Residents.js";
import Blotter from "../models/Blotters.js";
import Certificate from "../models/Certificates.js";
import CourtReservation from "../models/CourtReservations.js";
import Household from "../models/Households.js";
import Prompt from "../models/Prompts.js";
import SOS from "../models/SOS.js";
import Employee from "../models/Employees.js";

export const getPrompts = async (req, res) => {
  try {
    const { userID } = req.user;

    const response = await Prompt.find({ user: userID });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getting prompts:", error?.response?.data || error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const analyticsAI = async (req, res) => {
  try {
    const { userID } = req.user;
    const { prompt } = req.body;

    // FETCH DATA

    const reports = await SOS.find()
      .populate({
        path: "resID",
        select: "firstname lastname mobilenumber householdno",
        populate: { path: "householdno" },
      })
      .populate({
        path: "responder.empID",
        populate: {
          path: "resID",
          select: "firstname lastname mobilenumber householdno",
          populate: "householdno",
        },
      });
    const employees = await Employee.find().populate("resID");
    const residents = await Resident.find();

    const households = await Household.find();

    const blotters = await Blotter.find(
      {},
      {
        status: 1,
        typeofthecomplaint: 1,
        details: 1,
        agreementdetails: 1,
        remarks: 1,
        createdAt: 1,
        scheduleAt: 1,
      }
    ).lean();

    const documents = await Certificate.find(
      {},
      {
        typeofcertificate: 1,
        purpose: 1,
        businessname: 1,
        lineofbusiness: 1,
        locationofbusiness: 1,
        amount: 1,
        remarks: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    ).lean();

    const reservations = await CourtReservation.find(
      {},
      {
        purpose: 1,
        times: 1,
        amount: 1,
        remarks: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    ).lean();

    // TOTALS

    const residentsData = {
      totalResidents: 0,
      totalMale: 0,
      totalFemale: 0,
      totalVoters: 0,
      totalSenior: 0,
      totalInfant: 0,
      totalNewborn: 0,
      totalUnder5: 0,
      totalSchoolAge: 0,
      totalAdolescent: 0,
      totalAdult: 0,
      totalPostpartum: 0,
      totalWomenOfReproductive: 0,
      totalPregnant: 0,
      totalPWD: 0,
      totalHypertension: 0,
      totalDiabetes: 0,
      totalTuberculosis: 0,
      totalSurgery: 0,
      statusCounts: {},
    };

    residentsData.brgyIDs = [];

    residents.forEach((res) => {
      residentsData.statusCounts[res.status] =
        (residentsData.statusCounts[res.status] || 0) + 1;

      if (res.status !== "Active") return;
      residentsData.totalResidents += 1;

      if (res.sex === "Male") residentsData.totalMale += 1;
      if (res.sex === "Female") residentsData.totalFemale += 1;

      if (res.voter) residentsData.totalVoters += 1;

      if (res.isSenior) residentsData.totalSenior += 1;
      if (res.isInfant) residentsData.totalInfant += 1;
      if (res.isNewborn) residentsData.totalNewborn += 1;
      if (res.isUnder5) residentsData.totalUnder5 += 1;
      if (res.isSchoolAge) residentsData.totalSchoolAge += 1;
      if (res.isAdolescent) residentsData.totalAdolescent += 1;
      if (res.isAdult) residentsData.totalAdult += 1;

      if (res.isPostpartum) residentsData.totalPostpartum += 1;
      if (res.isWomenOfReproductive)
        residentsData.totalWomenOfReproductive += 1;
      if (res.isPregnant) residentsData.totalPregnant += 1;
      if (res.isPWD) residentsData.totalPWD += 1;

      if (res.haveHypertension) residentsData.totalHypertension += 1;
      if (res.haveDiabetes) residentsData.totalDiabetes += 1;
      if (res.haveTubercolosis) residentsData.totalTuberculosis += 1;
      if (res.haveSurgery) residentsData.totalSurgery += 1;

      res.brgyID?.forEach((b) =>
        residentsData.brgyIDs.push({
          idNumber: b.idNumber,
          expirationDate: b.expirationDate,
        })
      );
    });

    const householdsData = {
      totalHouseholds: 0,
      statusCounts: {},
      totalMembers: 0,
      ethnicityCounts: {},
      socioStatusCounts: {},
      vehiclesCount: 0,
      vehicleTypes: {},
      households: [],
    };

    households.forEach((hh) => {
      householdsData.statusCounts[hh.status] =
        (householdsData.statusCounts[hh.status] || 0) + 1;

      if (hh.status !== "Active") return;

      householdsData.totalHouseholds += 1;
      householdsData.totalMembers += hh.members.length;

      householdsData.ethnicityCounts[hh.ethnicity] =
        (householdsData.ethnicityCounts[hh.ethnicity] || 0) + 1;

      householdsData.socioStatusCounts[hh.sociostatus] =
        (householdsData.socioStatusCounts[hh.sociostatus] || 0) + 1;

      householdsData.vehiclesCount += hh.vehicles.length;
      hh.vehicles.forEach((v) => {
        householdsData.vehicleTypes[v.kind] =
          (householdsData.vehicleTypes[v.kind] || 0) + 1;
      });

      householdsData.households.push({
        householdno: hh.householdno,
        address: hh.address,
        members: hh.members.map((m) => ({
          resID: m.resID,
          position: m.position,
        })),
        vehicles: hh.vehicles.map((v) => ({
          model: v.model,
          color: v.color,
          kind: v.kind,
          platenumber: v.platenumber,
        })),
      });
    });

    let totalCertificateAmount = 0;
    const certificateStatusCounts = {};
    documents.forEach((doc) => {
      if (doc.status === "Collected") {
        const amt =
          parseFloat(doc.amount?.toString().replace(/[₱,]/g, "")) || 0;
        totalCertificateAmount += amt;
      }

      certificateStatusCounts[doc.status] =
        (certificateStatusCounts[doc.status] || 0) + 1;
    });

    let totalReservationAmount = 0;
    const reservationStatusCounts = {};
    reservations.forEach((r) => {
      if (r.status === "Approved") {
        const amt = parseFloat(r.amount?.toString().replace(/[₱,]/g, "")) || 0;
        totalReservationAmount += amt;
      }

      reservationStatusCounts[r.status] =
        (reservationStatusCounts[r.status] || 0) + 1;
    });

    const blotterStatusCounts = {};
    blotters.forEach((b) => {
      blotterStatusCounts[b.status] = (blotterStatusCounts[b.status] || 0) + 1;
    });

    const data = {
      summaries: {
        residents: residentsData,
        households: householdsData,
        documents: {
          total: documents.length,
          totalAmount: totalCertificateAmount,
          statusCounts: certificateStatusCounts,
        },
        reservations: {
          total: reservations.length,
          totalAmount: totalReservationAmount,
          statusCounts: reservationStatusCounts,
        },
        blotters: {
          total: blotters.length,
          statusCounts: blotterStatusCounts,
        },
      },
      raw: {
        blotters,
        documents,
        reservations,
        residents,
        households,
        employees,
        reports,
      },
    };

    // PROMPT
    const geminiPrompt = `
    You are an analytics assistant for barangay officials. 
    When answering, follow these rules strictly:
    - Do NOT mention technical field names like createdAt, updatedAt, or scheduleAt.  
    - Do NOT explain your step-by-step process or how you calculated.
    - Do NOT mention or repeat raw database status labels (e.g., "Not Yet Collected", "Pending").  
    - Instead, translate statuses into plain language (e.g., "still not collected", "waiting for release").
    - Use the same language that was used in the question.  
    - Focus only on the findings, trends, and insights.   
    - Only use the dataset below to calculate. 
    - If the dataset does not have enough information to answer, reply with "Information not available."  
    ⚡ Important: If the question asks "what should be done", "how to improve", or similar prescriptive intent, provide **recommendations, actionable steps, or advice** based on the data.  


    Question:
    ${prompt}

    Dataset:
    ${JSON.stringify(data, null, 2)}
    `;

    // STEP 3: Send request to Gemini API
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: geminiPrompt }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response =
      geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    await Prompt.create({
      user: userID,
      prompt,
      response,
      model: "gemini-2.0",
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in analyticsAI:", error?.response?.data || error);
    res.status(500).json({ message: "Internal server error" });
  }
};
