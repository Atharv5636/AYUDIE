const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const connectDB = require("../src/config/db");
const app = require("../src/app");
const Patient = require("../src/models/patient.model");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const PORT = Number(process.env.DEBUG_TEST_PORT || 3101);
const BASE_URL = `http://localhost:${PORT}`;

const TEST_CASES = [
  {
    name: "Case 1: High adherence and improving weight",
    patientId: "69cd4343a03afa3edcdabbcf",
    progress: {
      weight: 79.9,
      energyLevel: 5,
      digestion: "good",
      adherence: 95,
      notes: "debug run: high adherence",
    },
  },
  {
    name: "Case 2: Low adherence",
    patientId: "69cd4343a03afa3edcdabbf6",
    progress: {
      weight: 74.5,
      energyLevel: 2,
      digestion: "bad",
      adherence: 25,
      notes: "debug run: low adherence",
    },
  },
  {
    name: "Case 3: Conflicting signals",
    patientId: "69cd4343a03afa3edcdabc1d",
    progress: {
      weight: 88.2,
      energyLevel: 3,
      digestion: "good",
      adherence: 35,
      notes: "debug run: conflicting",
    },
  },
  {
    name: "Case 4: No logs (now triggered via progress)",
    patientId: "69cd4343a03afa3edcdabc44",
    progress: {
      weight: 70.0,
      energyLevel: 3,
      digestion: "good",
      adherence: 60,
      notes: "debug run: first log",
    },
  },
];

async function api(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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

function printResult(caseName, patientId, analysis) {
  console.log(`\n${caseName}`);
  console.log(`patientId: ${patientId}`);
  console.log(`effectiveness: ${analysis?.effectiveness ?? "-"}`);
  console.log(`trend: ${analysis?.trend ?? "-"}`);
  console.log(`primaryIssue: ${analysis?.primaryIssue ?? "-"}`);
}

async function runCase(testCase) {
  const patient = await Patient.findById(testCase.patientId).select("doctor").lean();

  if (!patient) {
    console.log(`\n${testCase.name}`);
    console.log(`patientId: ${testCase.patientId}`);
    console.log("effectiveness: -");
    console.log("trend: -");
    console.log("primaryIssue: -");
    console.log("note: patient not found");
    return;
  }

  const token = jwt.sign({ id: String(patient.doctor) }, JWT_SECRET, {
    expiresIn: "7d",
  });

  await api("/progress", {
    method: "POST",
    token,
    body: {
      patientId: testCase.patientId,
      ...testCase.progress,
    },
  });

  const plansData = await api(`/plans/patient/${testCase.patientId}`, {
    method: "GET",
    token,
  });

  const activePlan = (plansData?.plans || []).find((plan) => plan?.isActive) || plansData?.plans?.[0];
  printResult(testCase.name, testCase.patientId, activePlan?.analysis);
}

async function runOnce(iteration) {
  console.log(`\n================ RUN ${iteration} ================`);
  for (const testCase of TEST_CASES) {
    await runCase(testCase);
  }
}

async function main() {
  await connectDB();

  const server = app.listen(PORT, async () => {
    try {
      await runOnce(1);
      await runOnce(2);
    } catch (error) {
      console.error("\nDebug test failed:", error.message || error);
    } finally {
      server.close(async () => {
        await mongoose.connection.close();
      });
    }
  });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
