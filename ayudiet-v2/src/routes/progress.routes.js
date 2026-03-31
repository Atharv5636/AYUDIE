const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const {
  createProgressLog,
  getProgressLogsByPatient,
} = require("../controllers/progress.controller");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createProgressLog);
router.get("/:patientId", getProgressLogsByPatient);

module.exports = router;
