import SOS from "../models/SOS.js";

export const getReports = async (req, res) => {
  try {
    const reports = await SOS.find()
      .populate({
        path: "resID",
        select: "firstname lastname age mobilenumber picture householdno",
        populate: {
          path: "householdno",
          select: "address",
        },
      })
      .populate({
        path: "responder.empID",
        populate: {
          path: "resID",
          select: "firstname lastname mobilenumber picture",
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

    const formattedReports = reports.map((r) => ({
      ...r.toObject(),
      updatedAt: formatDatePH(r.updatedAt),
      createdAt: formatDatePH(r.createdAt),
      responder: Array.isArray(r.responder)
        ? r.responder.map((res) => ({
            ...res.toObject(),
            arrivedat: res.arrivedat ? formatDatePH(res.arrivedat) : null,
          }))
        : [],
    }));

    return res.status(200).json(formattedReports);
  } catch (error) {
    console.error("Error getting SOS:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
