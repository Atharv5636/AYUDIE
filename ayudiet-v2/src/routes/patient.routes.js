const express = require("express");
const {
  addPatient,
  getPatients,
   getPatientById, 
} = require("../controllers/patient.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { updatePatient } = require("../controllers/patient.controller");
const { deletePatient } = require("../controllers/patient.controller");
const router = express.Router();

// Add patient (protected)
router.post("/", authMiddleware, addPatient);

// Get patients (protected)
router.get("/", authMiddleware, getPatients);
router.get("/:id", authMiddleware, getPatientById);

router.put("/:id", authMiddleware, updatePatient);
router.delete("/:id", authMiddleware, deletePatient);
module.exports = router;
