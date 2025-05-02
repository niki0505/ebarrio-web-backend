import CourtReservation from "../models/CourtReservations.js";

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
    const reservation = await CourtReservation.find().populate("resID");
    return res.status(200).json(reservation);
  } catch (error) {
    console.error("Error in fetching court reservations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
