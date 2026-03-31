const ApiError = require("../utils/ApiError");
const Patient = require("../models/patient.model");

const healthCheck = (req, res, next) => {
  const token = req.query.token;

  if (!token) {
    return next(new ApiError(400, "Token is required"));
  }

  res.status(200).json({
    success: true,
    message: "Ayudiet backend is healthy",
  });
};

const getDashboardStats = async (req, res, next) => {
  try {
    const doctorId = req.user.id;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const newPatients = await Patient.countDocuments({
      doctor: doctorId,
      createdAt: { $gte: last30Days },
    });

    const totalPatients = await Patient.countDocuments({
  doctor: doctorId
});


   res.status(200).json({
  totalPatients,
  newPatients,
  appointments: 0,
  recoveries: 0,
});

  } catch (error) {
    next(error);
  }



};

module.exports = {
  healthCheck,
  getDashboardStats,
};
