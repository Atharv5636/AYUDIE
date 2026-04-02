const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const mongoose = require("mongoose");
const Plan = require("../src/models/plan.model");

const headers = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function api(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${method} ${path} failed (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

function printAnalysis(caseName, patientId, analysis) {
  console.log(`\n=== ${caseName} ===`);
  console.log(`patientId: ${patientId}`);
  console.log(`effectiveness: ${analysis?.effectiveness ?? "-"}`);
  console.log(`trend: ${analysis?.trend ?? "-"}`);
  console.log(`primaryIssue: ${analysis?.primaryIssue ?? "-"}`);
}

async function createPatientAndActivePlan(token, suffix) {
  const patient = await api("/patients", {
    method: "POST",
    token,
    body: {
      name: `Test ${suffix}`,
      age: 30,
      gender: "male",
      weight: 75,
      dominantDosha: "vata",
    },
  });

  const reviewDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const startDate = new Date();

  await Plan.create({
    doctor: patient.patient.doctor,
    patient: patient.patient._id,
    title: `Plan ${suffix}`,
    doshaType: "vata",
    meals: [
      {
        day: "Day 1",
        breakfast: "idli",
        lunch: "khichdi",
        dinner: "moong soup",
      },
    ],
    startDate,
    reviewDueDate,
    isActive: true,
    status: "approved",
  });

  return { patientId: patient.patient._id };
}

async function submitProgress(token, patientId, logs) {
  for (const log of logs) {
    await api("/progress", {
      method: "POST",
      token,
      body: {
        patientId,
        weight: log.weight,
        energyLevel: log.energyLevel,
        digestion: log.digestion,
        adherence: log.adherence,
        notes: log.notes || "",
      },
    });
  }
}

async function getActivePlanAnalysis(token, patientId) {
  const plansData = await api(`/plans/patient/${patientId}`, {
    method: "GET",
    token,
  });

  const activePlan = (plansData.plans || []).find((plan) => plan?.isActive) || plansData.plans?.[0];
  return activePlan?.analysis || null;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ayudiet");
  const ts = Date.now();
  const email = `analysis.test.${ts}@example.com`;
  const password = "Test@123456";

  await api("/auth/signup", {
    method: "POST",
    body: {
      name: "Analysis Tester",
      email,
      password,
    },
  });

  const login = await api("/auth/login", {
    method: "POST",
    body: { email, password },
  });

  const token = login.token;

  const case1 = await createPatientAndActivePlan(token, "High Adherence");
  await submitProgress(token, case1.patientId, [
    { weight: 82, energyLevel: 4, digestion: "good", adherence: 82 },
    { weight: 81.4, energyLevel: 4, digestion: "good", adherence: 88 },
    { weight: 80.8, energyLevel: 5, digestion: "good", adherence: 94 },
  ]);
  const case1Analysis = await getActivePlanAnalysis(token, case1.patientId);
  printAnalysis("Case 1: High adherence + improving weight", case1.patientId, case1Analysis);

  const case2 = await createPatientAndActivePlan(token, "Low Adherence");
  await submitProgress(token, case2.patientId, [
    { weight: 74, energyLevel: 3, digestion: "good", adherence: 35 },
    { weight: 74.2, energyLevel: 3, digestion: "good", adherence: 30 },
    { weight: 74.3, energyLevel: 2, digestion: "bad", adherence: 28 },
  ]);
  const case2Analysis = await getActivePlanAnalysis(token, case2.patientId);
  printAnalysis("Case 2: Low adherence", case2.patientId, case2Analysis);

  const case3 = await createPatientAndActivePlan(token, "Conflicting Signals");
  await submitProgress(token, case3.patientId, [
    { weight: 90, energyLevel: 4, digestion: "good", adherence: 90 },
    { weight: 89.3, energyLevel: 3, digestion: "good", adherence: 55 },
    { weight: 88.7, energyLevel: 3, digestion: "good", adherence: 40 },
  ]);
  const case3Analysis = await getActivePlanAnalysis(token, case3.patientId);
  printAnalysis("Case 3: Conflicting signals", case3.patientId, case3Analysis);

  const case4 = await createPatientAndActivePlan(token, "No Logs");
  const case4Analysis = await getActivePlanAnalysis(token, case4.patientId);
  printAnalysis("Case 4: No logs", case4.patientId, case4Analysis);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("\nTest run failed:");
  console.error(error.message || error);
  process.exit(1);
});
