const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const {
  createPlan,
  getPlansByPatient,
  getPendingPlans,
  generateAiPlan,
  generateAiDay,
  fixAiPlan,
  approvePlan,
  updatePlan,
  rejectPlan,
  getAdaptivePlanModifications,
} = require("../controllers/plan.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/pending", getPendingPlans);
router.get("/patient/:patientId", getPlansByPatient);
router.get("/patient/:patientId/adaptive-modifications", getAdaptivePlanModifications);
router.post("/generate-ai", generateAiPlan);
router.post("/generate-day", generateAiDay);
router.post("/fix-ai", fixAiPlan);
router.post("/", createPlan);
router.put("/:id", authMiddleware, updatePlan);
router.patch("/:id/approve", approvePlan);
router.patch("/:id/reject", rejectPlan);

module.exports = router;
