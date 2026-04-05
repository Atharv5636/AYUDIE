const mongoose = require("mongoose");
const ProgressLog = require("../models/progressLog.model");
const Patient = require("../models/patient.model");
const Plan = require("../models/plan.model");
const ApiError = require("../utils/ApiError");
const { modifyPlanBasedOnProgress } = require("../services/adaptivePlanService");
const debugLogsEnabled = process.env.DEBUG_LOGS === "true";
const debugLog = (...args) => {
  if (debugLogsEnabled) {
    console.log(...args);
  }
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const normalizeAdherenceScore = (value) => {
  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    return 30;
  }

  return Math.min(Math.max(parsedValue, 0), 100);
};

const createProgressLog = async (req, res, next) => {
  try {
    const {
      patient: patientFromBody,
      patientId: patientIdFromBody,
      weight,
      energy,
      energyLevel,
      digestion,
      adherence,
      notes,
    } = req.body;
    const patientId = patientFromBody || patientIdFromBody;
    const normalizedEnergyLevel = energyLevel ?? energy;

    if (!patientId || weight === undefined || !normalizedEnergyLevel || !digestion) {
      return next(
        new ApiError(
          400,
          "patient, weight, energyLevel, and digestion are required"
        )
      );
    }

    if (!isValidObjectId(patientId)) {
      return next(new ApiError(400, "Invalid patient id"));
    }

    const existingPatient = await Patient.findOne({
      _id: patientId,
      doctor: req.user.id,
    });

    if (!existingPatient) {
      return next(new ApiError(404, "Patient not found"));
    }

    const activePlan = await Plan.findOne({
      patient: patientId,
      doctor: req.user.id,
      isActive: true,
    });

    const progressLog = await ProgressLog.create({
      patient: patientId,
      plan: activePlan?._id || undefined,
      doctor: req.user.id,
      weight: Number(weight),
      energyLevel: Number(normalizedEnergyLevel),
      digestion,
      adherence: normalizeAdherenceScore(adherence),
      notes: notes?.trim() || "",
    });

    const result = await modifyPlanBasedOnProgress(patientId);
    const plan = await Plan.findOne({ patient: patientId, isActive: true });

    if (!plan) {
      debugLog("No active plan found for patient:", patientId);
    } else if (!result || !result.analysis) {
      debugLog("No analysis computed for patient:", patientId);
    } else {
      debugLog("Analysis result:", result);
      plan.analysis = result.analysis;
      plan.analysis.computedAt = new Date();
      await plan.save();
      debugLog("Updated analysis saved to plan:", plan.analysis);
    }

    res.status(201).json({
      success: true,
      progressLog,
    });
  } catch (error) {
    next(error);
  }
};

const getProgressLogsByPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (!isValidObjectId(patientId)) {
      return next(new ApiError(400, "Invalid patient id"));
    }

    const patient = await Patient.findOne({
      _id: patientId,
      doctor: req.user.id,
    });

    if (!patient) {
      return next(new ApiError(404, "Patient not found"));
    }

    const logs = await ProgressLog.find({
      patient: patientId,
      doctor: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate("plan", "title isActive");

    res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProgressLog,
  getProgressLogsByPatient,
};
