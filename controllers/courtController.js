import CourtReservation from "../models/CourtReservations.js";
import { getReservationsUtils } from "../utils/collectionUtils.js";

export const rejectCourtReq = async (req, res) => {
  try {
    const { reservationID } = req.params;
    const { remarks } = req.body;

    const court = await CourtReservation.findById(reservationID);
    if (!court) {
      return res.status(404).json({ message: "Court reservation not found" });
    }

    court.remarks = remarks;
    court.status = "Rejected";
    await court.save();

    return res.status(200).json({
      message: "Court reservation is rejected successfully",
    });
  } catch (error) {
    console.error("Error in rejecting court reservation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createReservation = async (req, res) => {
  try {
    const { reservationForm } = req.body;
    const reservation = new CourtReservation({
      ...reservationForm,
    });
    await reservation.save();
    return res
      .status(200)
      .json({ message: "Court reservation requested successfully!" });
  } catch (error) {
    console.error("Error submitting court reservation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const approveReservation = async (req, res) => {
  try {
    const { reservationID } = req.params;
    const reservation = await CourtReservation.findById(reservationID);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    await CourtReservation.findByIdAndUpdate(
      reservationID,
      { status: "Approved" },
      { new: true, runValidators: false }
    );
    return res
      .status(200)
      .json({ message: "Court reservation successfully approved" });
  } catch (error) {
    console.error("Error in approving court reservations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getReservations = async (req, res) => {
  try {
    const reservation = await getReservationsUtils();
    return res.status(200).json(reservation);
  } catch (error) {
    console.error("Error in fetching court reservations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
