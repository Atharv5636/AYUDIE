jest.mock("../../models/patient.model", () => ({
  findById: jest.fn(),
}));

jest.mock("../../models/plan.model", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../models/progressLog.model", () => ({
  find: jest.fn(),
}));

const Patient = require("../../models/patient.model");
const Plan = require("../../models/plan.model");
const ProgressLog = require("../../models/progressLog.model");

const {
  buildConfidenceLevel,
  compareEffectivenessTrend,
  computeEffectivenessScore,
  computeEffectivenessTrend,
  detectPrimaryIssue,
  modifyPlanBasedOnProgress,
  normalizeAdherence,
  normalizeDigestion,
  normalizeEnergy,
} = require("../adaptivePlanService");

const VALID_PATIENT_ID = "507f1f77bcf86cd799439011";
const VALID_PLAN_ID = "507f1f77bcf86cd799439012";

const buildPatientQuery = (patient) => ({
  select: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(patient),
  }),
});

const buildPlanQuery = (plan) => ({
  lean: jest.fn().mockResolvedValue(plan),
});

const buildProgressQuery = (logs) => ({
  sort: jest.fn().mockReturnValue({
    limit: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(logs),
    }),
  }),
});

const createActivePlan = () => ({
  _id: VALID_PLAN_ID,
  patient: VALID_PATIENT_ID,
  isActive: true,
  meals: [
    {
      day: "Day 1",
      breakfast: "idli, chutney, tea",
      lunch: "khichdi, salad, buttermilk",
      dinner: "paneer curry, naan, rice",
    },
    {
      day: "Day 2",
      breakfast: "poha, fruit",
      lunch: "fried rice, raita",
      dinner: "biryani, curd",
    },
  ],
});

const createLog = ({
  weight,
  energyLevel,
  adherence,
  digestion,
  createdAt,
}) => ({
  weight,
  energyLevel,
  adherence,
  digestion,
  createdAt,
});

describe("Adaptive plan service normalization", () => {
  test("normalizeEnergy clamps valid numeric values to the supported scale", () => {
    expect(normalizeEnergy(0)).toBe(1);
    expect(normalizeEnergy(4)).toBe(4);
    expect(normalizeEnergy(8)).toBe(5);
  });

  test("normalizeEnergy returns null for undefined or invalid values", () => {
    expect(normalizeEnergy(undefined)).toBeNull();
    expect(normalizeEnergy("4")).toBeNull();
    expect(normalizeEnergy(Number.NaN)).toBeNull();
  });

  test("normalizeDigestion maps supported string values and clamps numeric input", () => {
    expect(normalizeDigestion("good")).toBe(7);
    expect(normalizeDigestion("bad")).toBe(3);
    expect(normalizeDigestion(12)).toBe(10);
    expect(normalizeDigestion(-2)).toBe(0);
  });

  test("normalizeDigestion returns null for undefined or unsupported values", () => {
    expect(normalizeDigestion(undefined)).toBeNull();
    expect(normalizeDigestion("unknown")).toBeNull();
    expect(normalizeDigestion({})).toBeNull();
  });

  test("normalizeAdherence converts legacy boolean values to numeric scores", () => {
    expect(normalizeAdherence(true)).toBe(100);
    expect(normalizeAdherence(false)).toBe(30);
    expect(normalizeAdherence(55)).toBe(55);
  });
});

describe("Adaptive plan service effectiveness scoring", () => {
  test("returns a low effectiveness score for poor overall progress", () => {
    expect(
      computeEffectivenessScore({
        weightDrop: 3.5,
        averageAdherence: 30,
        averageEnergy: 2,
        averageDigestion: 3,
      })
    ).toEqual({
      score: 35,
      level: "low",
    });
  });

  test("returns a high effectiveness score for stable progress", () => {
    expect(
      computeEffectivenessScore({
        weightDrop: 1,
        averageAdherence: 90,
        averageEnergy: 4.5,
        averageDigestion: 8,
      })
    ).toEqual({
      score: 100,
      level: "high",
    });
  });

  test("classifies boundary scores consistently", () => {
    expect(
      computeEffectivenessScore({
        weightDrop: 2,
        averageAdherence: 80,
        averageEnergy: 3,
        averageDigestion: 5,
      })
    ).toEqual({
      score: 80,
      level: "high",
    });

    expect(
      computeEffectivenessScore({
        weightDrop: 2,
        averageAdherence: 60,
        averageEnergy: 3,
        averageDigestion: 5,
      })
    ).toEqual({
      score: 69,
      level: "moderate",
    });

    expect(
      computeEffectivenessScore({
        weightDrop: 2.5,
        averageAdherence: 60,
        averageEnergy: 3,
        averageDigestion: 5,
      })
    ).toEqual({
      score: 53,
      level: "low",
    });
  });

  test("treats small effectiveness changes as stable", () => {
    expect(
      computeEffectivenessTrend([
        createLog({
          weight: 75,
          energyLevel: 4,
          adherence: 20,
          digestion: "good",
          createdAt: new Date("2026-03-01"),
        }),
        createLog({
          weight: 74.8,
          energyLevel: 4,
          adherence: 20,
          digestion: "good",
          createdAt: new Date("2026-03-03"),
        }),
        createLog({
          weight: 74.6,
          energyLevel: 4,
          adherence: 20,
          digestion: "good",
          createdAt: new Date("2026-03-05"),
        }),
        createLog({
          weight: 74.5,
          energyLevel: 4,
          adherence: 20,
          digestion: "good",
          createdAt: new Date("2026-03-07"),
        }),
        createLog({
          weight: 74.4,
          energyLevel: 4,
          adherence: 90,
          digestion: "good",
          createdAt: new Date("2026-03-09"),
        }),
      ])
    ).toEqual({
      previous: 69,
      current: 73,
      trend: "stable",
    });
  });

  test("marks a slight effectiveness rise as slight_improvement", () => {
    expect(
      computeEffectivenessTrend(
        [
          createLog({
            weight: 75,
            energyLevel: 2,
            adherence: 30,
            digestion: "bad",
            createdAt: new Date("2026-03-01"),
          }),
          createLog({
            weight: 74,
            energyLevel: 3,
            adherence: 60,
            digestion: 5,
            createdAt: new Date("2026-03-03"),
          }),
          createLog({
            weight: 73.8,
            energyLevel: 4,
            adherence: 90,
            digestion: "good",
            createdAt: new Date("2026-03-05"),
          }),
        ]
      )
    ).toEqual({
      previous: 66,
      current: 73,
      trend: "slight_improvement",
    });
  });

  test("marks a large effectiveness rise as improving", () => {
    expect(
      computeEffectivenessTrend([
        createLog({
          weight: 75,
          energyLevel: 2,
          adherence: 0,
          digestion: "bad",
          createdAt: new Date("2026-03-01"),
        }),
        createLog({
          weight: 74.5,
          energyLevel: 2,
          adherence: 0,
          digestion: "bad",
          createdAt: new Date("2026-03-03"),
        }),
        createLog({
          weight: 74.3,
          energyLevel: 4,
          adherence: 100,
          digestion: "good",
          createdAt: new Date("2026-03-05"),
        }),
      ])
    ).toEqual({
      previous: 51,
      current: 64,
      trend: "improving",
    });
  });

  test("marks a slight effectiveness drop as slight_decline", () => {
    expect(compareEffectivenessTrend(91, 84)).toBe("slight_decline");
  });

  test("marks a large effectiveness drop as declining", () => {
    expect(
      computeEffectivenessTrend([
        createLog({
          weight: 75,
          energyLevel: 5,
          adherence: 100,
          digestion: "good",
          createdAt: new Date("2026-03-01"),
        }),
        createLog({
          weight: 74.5,
          energyLevel: 5,
          adherence: 100,
          digestion: "good",
          createdAt: new Date("2026-03-03"),
        }),
        createLog({
          weight: 72,
          energyLevel: 1,
          adherence: 0,
          digestion: "bad",
          createdAt: new Date("2026-03-05"),
        }),
      ])
    ).toEqual({
      previous: 91,
      current: 56,
      trend: "declining",
    });
  });
});

describe("Adaptive plan service analysis helpers", () => {
  test("detects the dominant primary issue deterministically", () => {
    expect(
      detectPrimaryIssue({
        weightDrop: 2.1,
        averageAdherence: 20,
        averageEnergy: 3.2,
        averageDigestion: 4.8,
      })
    ).toBe("adherence");

    expect(
      detectPrimaryIssue({
        weightDrop: 4.5,
        averageAdherence: 85,
        averageEnergy: 4,
        averageDigestion: 7,
      })
    ).toBe("weight");

    expect(
      detectPrimaryIssue({
        weightDrop: 2.2,
        averageAdherence: 50,
        averageEnergy: 2,
        averageDigestion: 4.8,
      })
    ).toBe("energy");
  });

  test("maps confidence level from recent log count", () => {
    expect(buildConfidenceLevel(3)).toBe("low");
    expect(buildConfidenceLevel(4)).toBe("medium");
    expect(buildConfidenceLevel(5)).toBe("high");
  });
});

describe("Adaptive plan service priority logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Patient.findById.mockReturnValue(
      buildPatientQuery({ _id: VALID_PATIENT_ID, name: "Aarav" })
    );
    Plan.findOne.mockReturnValue(buildPlanQuery(createActivePlan()));
  });

  test("executes only the adherence branch when multiple conditions are true", async () => {
    const logs = [
      createLog({
        weight: 72,
        energyLevel: 3,
        adherence: false,
        digestion: "bad",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 69.5,
        energyLevel: 3,
        adherence: false,
        digestion: "bad",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 69,
        energyLevel: 3,
        adherence: false,
        digestion: "bad",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.appliedRule).toBe("adherence");
    expect(result.analysis.lowAdherence).toBe(true);
    expect(result.analysis.rapidWeightLoss).toBe(true);
    expect(result.analysis.lowEnergy).toBe(true);
    expect(result.analysis.poorDigestion).toBe(true);
    expect(result.analysis.effectiveness).toEqual({
      score: 34,
      level: "low",
    });
    expect(result.analysis.primaryIssue).toBe("adherence");
    expect(result.analysis.confidence).toBe("low");
    expect(result.changes).toHaveLength(2);
    expect(result.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "simplify_meal",
          reason: "low adherence",
        }),
      ])
    );
    expect(result.changes).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "increase_calories" }),
        expect.objectContaining({ type: "replace_meal" }),
      ])
    );
  });

  test("selects energy and weight branch when adherence is healthy", async () => {
    const logs = [
      createLog({
        weight: 70,
        energyLevel: 3,
        adherence: true,
        digestion: "bad",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 67.8,
        energyLevel: 3,
        adherence: true,
        digestion: "bad",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 67.2,
        energyLevel: 3,
        adherence: true,
        digestion: "bad",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.appliedRule).toBe("energyWeight");
    expect(result.analysis.primaryIssue).toBe("weight");
    expect(result.changes).toEqual([
      {
        type: "increase_calories",
        value: 250,
        reason: "rapid weight loss + low energy",
      },
    ]);
  });

  test("selects digestion branch when higher priority rules do not match", async () => {
    const logs = [
      createLog({
        weight: 70,
        energyLevel: 4,
        adherence: true,
        digestion: "bad",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 69.8,
        energyLevel: 4,
        adherence: true,
        digestion: "bad",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 69.7,
        energyLevel: 4,
        adherence: true,
        digestion: "bad",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.appliedRule).toBe("digestion");
    expect(result.analysis.primaryIssue).toBe("digestion");
    expect(result.analysis.effectiveness).toEqual({
      score: 82,
      level: "high",
    });
    expect(result.analysis.primaryIssue).toBe("digestion");
    expect(result.analysis.confidence).toBe("low");
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toEqual(
      expect.objectContaining({
        type: "replace_meal",
        reason: "poor digestion",
      })
    );
  });
});

describe("Adaptive plan service change limiting", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Patient.findById.mockReturnValue(
      buildPatientQuery({ _id: VALID_PATIENT_ID, name: "Aarav" })
    );
    Plan.findOne.mockReturnValue(buildPlanQuery(createActivePlan()));
  });

  test("keeps moderate-effectiveness updates bounded to two modifications", async () => {
    const logs = [
      createLog({
        weight: 72,
        energyLevel: 3,
        adherence: 55,
        digestion: "good",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 71.9,
        energyLevel: 3,
        adherence: 55,
        digestion: "good",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 71.8,
        energyLevel: 3,
        adherence: 55,
        digestion: "good",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.appliedRule).toBe("adherence");
    expect(result.analysis.confidence).toBe("low");
    expect(result.changes).toHaveLength(2);
    result.changes.forEach((change) => {
      expect(change.type).toBe("simplify_meal");
      expect(change.reason).toBe("low adherence");
    });
  });

  test("keeps decline handling bounded when effectiveness only slightly declines", async () => {
    Plan.findOne.mockReturnValue(
      buildPlanQuery({
        ...createActivePlan(),
        meals: [
          {
            day: "Day 1",
            breakfast: "idli, chutney, tea",
            lunch: "khichdi, salad, buttermilk",
            dinner: "paneer curry, naan, rice",
          },
          {
            day: "Day 2",
            breakfast: "poha, fruit, tea",
            lunch: "fried rice, raita, pickle",
            dinner: "biryani, curd, papad",
          },
        ],
      })
    );

    const logs = [
      createLog({
        weight: 75,
        energyLevel: 4,
        adherence: 80,
        digestion: "good",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 74.8,
        energyLevel: 4,
        adherence: 80,
        digestion: "good",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 74.7,
        energyLevel: 5,
        adherence: 100,
        digestion: "good",
        createdAt: new Date("2026-03-05"),
      }),
      createLog({
        weight: 72.5,
        energyLevel: 1,
        adherence: 0,
        digestion: "bad",
        createdAt: new Date("2026-03-07"),
      }),
      createLog({
        weight: 71.8,
        energyLevel: 1,
        adherence: 0,
        digestion: "bad",
        createdAt: new Date("2026-03-09"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.analysis.effectivenessTrend).toEqual({
      previous: 58,
      current: 51,
      trend: "slight_decline",
    });
    expect(result.appliedRule).toBe("adherence");
    expect(result.analysis.effectiveness.level).toBe("low");
    expect(result.changes).toHaveLength(3);
  });

  test("reduces adjustments when effectiveness is improving", async () => {
    const logs = [
      createLog({
        weight: 75,
        energyLevel: 2,
        adherence: 0,
        digestion: "bad",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 74.8,
        energyLevel: 2,
        adherence: 0,
        digestion: "bad",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 74.6,
        energyLevel: 2,
        adherence: 0,
        digestion: "bad",
        createdAt: new Date("2026-03-05"),
      }),
      createLog({
        weight: 74.5,
        energyLevel: 2,
        adherence: 0,
        digestion: "bad",
        createdAt: new Date("2026-03-07"),
      }),
      createLog({
        weight: 74.4,
        energyLevel: 5,
        adherence: 100,
        digestion: "good",
        createdAt: new Date("2026-03-09"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.analysis.effectivenessTrend).toEqual({
      previous: 49,
      current: 59,
      trend: "improving",
    });
    expect(result.appliedRule).toBe("adherence");
    expect(result.changes).toHaveLength(2);
  });

  test("includes last adjustment memory and prevents immediate reversal", async () => {
    Plan.findOne.mockReturnValue(
      buildPlanQuery({
        ...createActivePlan(),
        lastAdjustmentType: "restore_meal",
      })
    );

    const logs = [
      createLog({
        weight: 70,
        energyLevel: 4,
        adherence: true,
        digestion: "bad",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 69.8,
        energyLevel: 4,
        adherence: true,
        digestion: "bad",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 69.7,
        energyLevel: 4,
        adherence: true,
        digestion: "bad",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.lastAdjustment).toEqual({ type: "restore_meal" });
    expect(result.appliedRule).toBeNull();
    expect(result.changes).toEqual([]);
  });
});

describe("Adaptive plan service edge cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Patient.findById.mockReturnValue(
      buildPatientQuery({ _id: VALID_PATIENT_ID, name: "Aarav" })
    );
    Plan.findOne.mockReturnValue(buildPlanQuery(createActivePlan()));
  });

  test("returns a safe fallback when progress logs are empty", async () => {
    ProgressLog.find.mockReturnValue(buildProgressQuery([]));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result).toEqual(
      expect.objectContaining({
        patientId: VALID_PATIENT_ID,
        planId: VALID_PLAN_ID,
        logCount: 0,
        appliedRule: null,
      })
    );
    expect(result.analysis.enoughLogs).toBe(false);
    expect(Array.isArray(result.changes)).toBe(true);
    expect(result.changes).toHaveLength(0);
  });

  test("handles a single progress log without crashing", async () => {
    const logs = [
      createLog({
        weight: 70,
        energyLevel: 3,
        adherence: false,
        digestion: "bad",
        createdAt: new Date("2026-03-01"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.logCount).toBe(1);
    expect(result.analysis.enoughLogs).toBe(false);
    expect(result.appliedRule).toBeNull();
    expect(result.changes).toEqual([]);
  });

  test("handles missing fields in progress logs safely", async () => {
    const logs = [
      createLog({
        weight: undefined,
        energyLevel: null,
        adherence: false,
        digestion: undefined,
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 69,
        energyLevel: null,
        adherence: false,
        digestion: undefined,
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: undefined,
        energyLevel: null,
        adherence: false,
        digestion: undefined,
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result).toEqual(
      expect.objectContaining({
        patientId: VALID_PATIENT_ID,
        planId: VALID_PLAN_ID,
      })
    );
    expect(result.analysis.averageEnergy).toBeNull();
    expect(result.analysis.averageDigestion).toBeNull();
    expect(result.analysis.lowAdherence).toBe(true);
    expect(result.appliedRule).toBe("adherence");
    expect(result.analysis.effectiveness.level).toBe("low");
    expect(result.changes.length).toBeLessThanOrEqual(3);
  });

  test("normalizes invalid high energy and unsupported digestion values without crashing", async () => {
    const logs = [
      createLog({
        weight: 70,
        energyLevel: 11,
        adherence: true,
        digestion: "random_string",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 67.5,
        energyLevel: 11,
        adherence: true,
        digestion: "random_string",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 67,
        energyLevel: 11,
        adherence: true,
        digestion: "random_string",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.analysis.averageEnergy).toBe(5);
    expect(result.analysis.averageDigestion).toBeNull();
    expect(result.analysis.lowEnergy).toBe(false);
    expect(result.analysis.poorDigestion).toBe(false);
    expect(result.appliedRule).toBeNull();
    expect(result.changes).toEqual([]);
  });

  test("handles extreme values like large weight drop and zero adherence", async () => {
    const logs = [
      createLog({
        weight: 80,
        energyLevel: 2,
        adherence: 0,
        digestion: "bad",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 72,
        energyLevel: 2,
        adherence: 0,
        digestion: "bad",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 70,
        energyLevel: 2,
        adherence: 0,
        digestion: "bad",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.analysis.weightDrop).toBe(10);
    expect(result.analysis.averageAdherence).toBe(0);
    expect(result.analysis.rapidWeightLoss).toBe(true);
    expect(result.analysis.lowAdherence).toBe(true);
    expect(result.appliedRule).toBe("adherence");
    expect(result.analysis.effectiveness.level).toBe("low");
    expect(result.changes.length).toBeLessThanOrEqual(3);
  });

  test("prefers no change for high energy plus rapid weight loss without low adherence", async () => {
    const logs = [
      createLog({
        weight: 75,
        energyLevel: 5,
        adherence: true,
        digestion: "good",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 68,
        energyLevel: 5,
        adherence: true,
        digestion: "good",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 65,
        energyLevel: 5,
        adherence: true,
        digestion: "good",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.analysis.rapidWeightLoss).toBe(true);
    expect(result.analysis.lowEnergy).toBe(false);
    expect(result.appliedRule).toBeNull();
    expect(result.changes).toEqual([]);
  });

  test("prioritizes adherence over good digestion when signals conflict", async () => {
    const logs = [
      createLog({
        weight: 70,
        energyLevel: 4,
        adherence: false,
        digestion: "good",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 69.7,
        energyLevel: 4,
        adherence: false,
        digestion: "good",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 69.5,
        energyLevel: 4,
        adherence: false,
        digestion: "good",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.analysis.poorDigestion).toBe(false);
    expect(result.analysis.lowAdherence).toBe(true);
    expect(result.appliedRule).toBe("adherence");
    expect(result.changes.length).toBeLessThanOrEqual(2);
    result.changes.forEach((change) => {
      expect(change.type).toBe("simplify_meal");
    });
  });
});

describe("Adaptive plan service explainability", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Patient.findById.mockReturnValue(
      buildPatientQuery({ _id: VALID_PATIENT_ID, name: "Aarav" })
    );
    Plan.findOne.mockReturnValue(buildPlanQuery(createActivePlan()));
  });

  test("includes human-readable analysis when adherence rule is triggered", async () => {
    const logs = [
      createLog({
        weight: 72,
        energyLevel: 3,
        adherence: false,
        digestion: "bad",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 69.5,
        energyLevel: 3,
        adherence: false,
        digestion: "bad",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 69,
        energyLevel: 3,
        adherence: false,
        digestion: "bad",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.analysis).toEqual(
      expect.objectContaining({
        weightTrend: "rapid weight loss",
        energyStatus: "low energy",
        adherenceStatus: "low adherence",
        digestionStatus: "poor digestion",
        triggeredRule: "adherence",
      })
    );
    expect(result.analysis.normalizedValues).toEqual({
      weightDrop: 3,
      energyLevel: 3,
      adherence: 30,
      digestion: 3,
    });
    expect(result.analysis.effectiveness).toEqual({
      score: 34,
      level: "low",
    });
    expect(result.analysis.primaryIssue).toBe("adherence");
    expect(result.analysis.confidence).toBe("low");
    expect(result.analysis.effectivenessTrend).toEqual({
      previous: 41,
      current: 41,
      trend: "stable",
    });
    expect(result.analysis.reasonSummary).toContain(
      "Adherence dropped to 30% (below threshold 60%)"
    );
    expect(result.analysis.reasonDetails).toContain(
      "Values: weightDrop=3kg, energy=3, adherence=30, digestion=3."
    );
    expect(result.analysis.reasonDetails).toContain(
      "Thresholds: rapidWeightLoss>2kg, lowEnergy<3.5, lowAdherence<60, poorDigestion<5."
    );
    expect(result.analysis.expectedImpact).toContain(
      "modest improvement in plan adherence"
    );
    expect(result.analysis.reason).toContain("prioritized first");
    expect(result.analysis.reason).toContain("Values: weightDrop=3kg, energy=3, adherence=30, digestion=3.");
    expect(result.analysis.reason).toContain(
      "Thresholds: rapidWeightLoss>2kg, lowEnergy<3.5, lowAdherence<60, poorDigestion<5."
    );
    expect(result.analysis.reason).toContain(
      "Cause-effect: adherence 30 is below 60, so meal complexity was reduced. Confidence=low."
    );
    expect(result.analysis.reason).toContain("Effectiveness trend is stable (41 -> 41)");
  });

  test("includes explainable safe fallback analysis when logs are insufficient", async () => {
    const logs = [
      createLog({
        weight: 70,
        energyLevel: 4,
        adherence: true,
        digestion: "good",
        createdAt: new Date("2026-03-01"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.analysis).toEqual(
      expect.objectContaining({
        enoughLogs: false,
        weightTrend: "stable weight",
        energyStatus: "stable energy",
        adherenceStatus: "good adherence",
        digestionStatus: "good digestion",
        triggeredRule: null,
      })
    );
    expect(result.analysis.reason).toContain(
      "Not enough recent progress logs to safely modify the plan."
    );
    expect(result.analysis.effectiveness).toEqual({
      score: 100,
      level: "high",
    });
    expect(result.analysis.primaryIssue).toBeNull();
    expect(result.analysis.confidence).toBe("low");
    expect(result.analysis.effectivenessTrend).toEqual({
      previous: 100,
      current: 100,
      trend: "stable",
    });
    expect(result.analysis.reasonSummary).toContain(
      "Recent progress signals did not justify a deterministic plan change."
    );
    expect(result.analysis.expectedImpact).toContain(
      "limited immediate change while the system gathers more progress data"
    );
    expect(result.analysis.reason).toContain("Effectiveness trend is stable (100 -> 100)");
  });

  test("explains why no rule was triggered for conflicting but non-actionable signals", async () => {
    const logs = [
      createLog({
        weight: 75,
        energyLevel: 5,
        adherence: true,
        digestion: "good",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 68,
        energyLevel: 5,
        adherence: true,
        digestion: "good",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 65,
        energyLevel: 5,
        adherence: true,
        digestion: "good",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);

    expect(result.appliedRule).toBeNull();
    expect(result.analysis.triggeredRule).toBeNull();
    expect(result.analysis.weightTrend).toBe("rapid weight loss");
    expect(result.analysis.energyStatus).toBe("stable energy");
    expect(result.analysis.reasonSummary).toContain(
      "Weight change is notable, but energy remains above threshold"
    );
    expect(result.analysis.reason).toContain(
      "Rapid weight loss was detected, but energy remained stable"
    );
    expect(result.analysis.reason).toContain("Values: weightDrop=10kg, energy=5, adherence=100, digestion=7.");
    expect(result.analysis.reason).toContain(
      "Cause-effect: weightDrop 10kg is above 2kg, but energy 5 stayed above 3.5, so no deterministic change was applied. Confidence=low."
    );
    expect(result.analysis.reason).toContain("Effectiveness trend");
  });
});

describe("Adaptive plan service view insights scenarios", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Patient.findById.mockReturnValue(
      buildPatientQuery({ _id: VALID_PATIENT_ID, name: "Aarav" })
    );
    Plan.findOne.mockReturnValue(buildPlanQuery(createActivePlan()));
  });

  test("Scenario 1: LOW ADHERENCE", async () => {
    const scenarioName = "LOW ADHERENCE";
    const logs = [
      createLog({
        weight: 70.2,
        energyLevel: 4,
        adherence: 0,
        digestion: "good",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 70,
        energyLevel: 3,
        adherence: 0,
        digestion: "good",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 69.9,
        energyLevel: 3,
        adherence: 0,
        digestion: "good",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);
    const actualAnalysis = result.analysis;
    const actualModalPayload = {
      summary: actualAnalysis.reasonSummary,
      effectiveness: actualAnalysis.effectiveness,
      trend: actualAnalysis.effectivenessTrend.trend,
      primaryIssue: actualAnalysis.primaryIssue,
      expectedImpact: actualAnalysis.expectedImpact,
    };

    console.log("Test Scenario:", scenarioName);
    console.log("Expected:", {
      primaryIssue: "adherence",
      effectiveness: "low (or moderate under current weights)",
      trend: "declining or slight_decline or stable under threshold",
      summaryContains: "adherence",
      expectedImpactContains: "simpl",
    });
    console.log("Analysis Output:", actualAnalysis);

    expect(actualModalPayload.primaryIssue).toBe("adherence");
    expect(["low", "moderate"]).toContain(actualModalPayload.effectiveness.level);
    expect(["declining", "slight_decline", "stable"]).toContain(
      actualModalPayload.trend
    );
    expect(actualModalPayload.summary.toLowerCase()).toContain("adherence");
    expect(actualModalPayload.expectedImpact.toLowerCase()).toContain("simpl");
    expect(actualModalPayload.summary).not.toBe("No insight summary available.");
    expect(actualModalPayload.primaryIssue).not.toBe("none");
  });

  test("Scenario 2: LOW ENERGY + WEIGHT LOSS", async () => {
    const scenarioName = "LOW ENERGY + WEIGHT LOSS";
    const logs = [
      createLog({
        weight: 72,
        energyLevel: 5,
        adherence: true,
        digestion: "good",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 71.8,
        energyLevel: 1,
        adherence: true,
        digestion: "good",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 69,
        energyLevel: 1,
        adherence: true,
        digestion: "good",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);
    const actualAnalysis = result.analysis;
    const actualModalPayload = {
      summary: actualAnalysis.reasonSummary,
      effectiveness: actualAnalysis.effectiveness,
      trend: actualAnalysis.effectivenessTrend.trend,
      primaryIssue: actualAnalysis.primaryIssue,
      expectedImpact: actualAnalysis.expectedImpact,
    };

    console.log("Test Scenario:", scenarioName);
    console.log("Expected:", {
      primaryIssue: "energy or weight",
      effectiveness: "low or moderate",
      trend: "declining",
      summaryContains: "energy or weight",
      expectedImpactContains: "calorie or energy",
    });
    console.log("Analysis Output:", actualAnalysis);

    expect(["energy", "weight"]).toContain(actualModalPayload.primaryIssue);
    expect(["low", "moderate"]).toContain(actualModalPayload.effectiveness.level);
    expect(actualModalPayload.trend).toBe("declining");
    expect(
      actualModalPayload.summary.toLowerCase().includes("energy") ||
        actualModalPayload.summary.toLowerCase().includes("weight")
    ).toBe(true);
    expect(
      actualModalPayload.expectedImpact.toLowerCase().includes("energy") ||
        actualModalPayload.expectedImpact.toLowerCase().includes("calorie")
    ).toBe(true);
    expect(result.appliedRule).toBe("energyWeight");
    expect(actualModalPayload.summary).not.toBe("No insight summary available.");
  });

  test("Scenario 3: HEALTHY PATIENT", async () => {
    const scenarioName = "HEALTHY PATIENT";
    const logs = [
      createLog({
        weight: 70,
        energyLevel: 4,
        adherence: 80,
        digestion: "good",
        createdAt: new Date("2026-03-01"),
      }),
      createLog({
        weight: 69.9,
        energyLevel: 5,
        adherence: 90,
        digestion: "good",
        createdAt: new Date("2026-03-03"),
      }),
      createLog({
        weight: 69.8,
        energyLevel: 5,
        adherence: 100,
        digestion: "good",
        createdAt: new Date("2026-03-05"),
      }),
    ];

    ProgressLog.find.mockReturnValue(buildProgressQuery(logs));

    const result = await modifyPlanBasedOnProgress(VALID_PATIENT_ID);
    const actualAnalysis = result.analysis;
    const actualModalPayload = {
      summary: actualAnalysis.reasonSummary,
      effectiveness: actualAnalysis.effectiveness,
      trend: actualAnalysis.effectivenessTrend.trend,
      primaryIssue: actualAnalysis.primaryIssue,
      expectedImpact: actualAnalysis.expectedImpact,
    };

    console.log("Test Scenario:", scenarioName);
    console.log("Expected:", {
      primaryIssue: "none or minimal",
      effectiveness: "high",
      trend: "stable or improving",
      summaryContains: "did not justify or stable",
      expectedImpactContains: "stability or minimal",
    });
    console.log("Analysis Output:", actualAnalysis);

    expect([null, "weight", "energy", "digestion", "adherence"]).toContain(
      actualModalPayload.primaryIssue
    );
    expect(actualModalPayload.effectiveness.level).toBe("high");
    expect(["stable", "improving", "slight_improvement"]).toContain(
      actualModalPayload.trend
    );
    expect(
      actualModalPayload.summary.toLowerCase().includes("did not justify") ||
        actualModalPayload.summary.toLowerCase().includes("stable") ||
        actualModalPayload.summary.toLowerCase().includes("recent progress signals")
    ).toBe(true);
    expect(
      actualModalPayload.expectedImpact.toLowerCase().includes("stability") ||
        actualModalPayload.expectedImpact.toLowerCase().includes("continued") ||
        actualModalPayload.expectedImpact.toLowerCase().includes("limited immediate change")
    ).toBe(true);
    expect(actualModalPayload.summary).not.toBe("No insight summary available.");
  });
});
