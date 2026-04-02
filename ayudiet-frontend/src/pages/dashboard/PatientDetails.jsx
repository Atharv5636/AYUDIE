import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchJson } from "../../services/api";
import {
  createProgressLog,
  fetchProgressLogs,
} from "../../services/progress.service";
import {
  createPlan,
  fetchPlansByPatient,
  fixAiPlan,
  generateAiPlan,
  updatePlan,
} from "../../services/plan.service";
import usePlansStore from "../../store/plansStore";
import { validatePlan } from "../../utils/planValidation";

const createMealDay = (index) => ({
  day: `Day ${index + 1}`,
  breakfast: "",
  lunch: "",
  dinner: "",
});

const average = (values = []) =>
  values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null;

const LOW_ADHERENCE_SCORE = 30;
const HIGH_ADHERENCE_SCORE = 100;

const normalizeAdherenceValue = (value) => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? HIGH_ADHERENCE_SCORE : LOW_ADHERENCE_SCORE;
  }

  return null;
};

function PatientDetails() {
  const { id } = useParams();

  const [patient, setPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [dosha, setDosha] = useState("");
  const [date, setDate] = useState("");
  const [days, setDays] = useState([createMealDay(0)]);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isImprovingPlan, setIsImprovingPlan] = useState(false);
  const [autoFixChanges, setAutoFixChanges] = useState([]);
  const [lastGeneratedContext, setLastGeneratedContext] = useState(null);
  const [lastProgressInsights, setLastProgressInsights] = useState([]);
  const [progressLogs, setProgressLogs] = useState([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressForm, setProgressForm] = useState({
    weight: patient?.weight || "",
    energyLevel: "3",
    digestion: "good",
    adherence: false,
    notes: "",
  });
  const [toast, setToast] = useState("");

  const plans = usePlansStore((state) => state.patientPlans[id]);
  const setPatientPlans = usePlansStore((state) => state.setPatientPlans);
  const upsertPatientPlan = usePlansStore((state) => state.upsertPatientPlan);

  const visiblePlans = plans || [];
  const activePlan = visiblePlans.find((plan) => plan.isActive) || null;
  const loading = patientLoading || plansLoading;
  const builderValidation = useMemo(
    () => validatePlan(days, dosha),
    [days, dosha]
  );
  const progressTrendSummary = useMemo(() => {
    if (!progressLogs.length) {
      return {
        weightTrend: { label: "No data", arrow: "->" },
        energyTrend: { label: "No data", arrow: "->" },
        adherence: { label: "No data", arrow: "->" },
      };
    }

    const orderedLogs = [...progressLogs].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );

    const weightLogs = orderedLogs.filter((log) => typeof log.weight === "number");
    const first = weightLogs[0];
    const last = weightLogs[weightLogs.length - 1];
    const directWeightDiff =
      typeof first?.weight === "number" && typeof last?.weight === "number"
        ? Number((last.weight - first.weight).toFixed(1))
        : 0;
    const recentWeightLogs = weightLogs.slice(-3);
    const previousWeightLogs =
      weightLogs.length > 3
        ? weightLogs.slice(0, Math.max(weightLogs.length - 3, 1))
        : weightLogs.slice(0, -1);
    const avgRecentWeight = average(recentWeightLogs.map((log) => log.weight));
    const avgPreviousWeight = average(
      previousWeightLogs.map((log) => log.weight)
    );
    const weightDiff =
      typeof avgRecentWeight === "number" && typeof avgPreviousWeight === "number"
        ? Number((avgRecentWeight - avgPreviousWeight).toFixed(1))
        : directWeightDiff;

    const energyLogs = orderedLogs.filter(
      (log) => typeof log.energyLevel === "number"
    );
    const recentEnergyLogs = energyLogs.slice(-3);
    const previousEnergyLogs =
      energyLogs.length > 3
        ? energyLogs.slice(0, Math.max(energyLogs.length - 3, 1))
        : energyLogs.slice(0, -1);
    const currentEnergy = average(recentEnergyLogs.map((log) => log.energyLevel));
    const previousEnergy = average(
      previousEnergyLogs.map((log) => log.energyLevel)
    );

    const adherenceValues = orderedLogs
      .map((log) => normalizeAdherenceValue(log.adherence))
      .filter((value) => typeof value === "number");
    const adherenceRate =
      adherenceValues.length > 0 ? average(adherenceValues) / 100 : null;

    const weightTrend =
      weightDiff > 1
        ? { label: `Increasing (+${weightDiff}kg)`, arrow: "↑" }
        : weightDiff < -1
          ? { label: `Decreasing (${weightDiff}kg)`, arrow: "↓" }
          : { label: "Stable", arrow: "→" };

    const energyTrend =
      typeof currentEnergy === "number" && typeof previousEnergy === "number"
        ? currentEnergy > previousEnergy + 0.3
          ? {
              label: `${previousEnergy.toFixed(1)} -> ${currentEnergy.toFixed(1)}`,
              arrow: "↑",
            }
          : currentEnergy < previousEnergy - 0.3
            ? {
                label: `${previousEnergy.toFixed(1)} -> ${currentEnergy.toFixed(1)}`,
                arrow: "↓",
              }
            : {
                label: `${previousEnergy.toFixed(1)} -> ${currentEnergy.toFixed(1)}`,
                arrow: "→",
              }
        : { label: "No data", arrow: "→" };

    const adherence =
      adherenceRate >= 0.8
        ? { label: `Good (${Math.round(adherenceRate * 100)}%)`, arrow: "↑" }
        : adherenceRate < 0.5
          ? { label: `Poor (${Math.round(adherenceRate * 100)}%)`, arrow: "↓" }
          : {
              label: `Moderate (${Math.round(adherenceRate * 100)}%)`,
              arrow: "→",
            };

    return {
      weightTrend,
      energyTrend,
      adherence,
    };
  }, [progressLogs]);

  const resetBuilder = () => {
    setShowForm(false);
    setEditingPlanId(null);
    setTitle("");
    setGoal("");
    setDosha("");
    setDate("");
    setDays([createMealDay(0)]);
    setAutoFixChanges([]);
    setLastGeneratedContext(null);
    setLastProgressInsights([]);
  };

  const startEditingPlan = (plan) => {
    setShowForm(true);
    setEditingPlanId(plan._id);
    setTitle(plan.title || "");
    setDosha(plan.doshaType || "");
    setDate(
      plan.reviewDueDate
        ? new Date(plan.reviewDueDate).toISOString().slice(0, 10)
        : ""
    );
    setDays(
      plan.meals?.length
        ? plan.meals.map((meal, index) => ({
            day: meal.day || `Day ${index + 1}`,
            breakfast: meal.breakfast || "",
            lunch: meal.lunch || "",
            dinner: meal.dinner || "",
          }))
        : [createMealDay(0)]
    );
    setAutoFixChanges([]);
    setLastGeneratedContext(null);
    setLastProgressInsights([]);
  };

  const updateDayField = (index, field, value) => {
    setAutoFixChanges([]);
    setDays((currentDays) =>
      currentDays.map((day, dayIndex) =>
        dayIndex === index ? { ...day, [field]: value } : day
      )
    );
  };

  const addDay = () => {
    setAutoFixChanges([]);
    setDays((currentDays) => [...currentDays, createMealDay(currentDays.length)]);
  };

  const removeDay = (index) => {
    setAutoFixChanges([]);
    setDays((currentDays) => {
      if (currentDays.length === 1) {
        return currentDays;
      }

      return currentDays
        .filter((_, dayIndex) => dayIndex !== index)
        .map((day, dayIndex) => ({
          ...day,
          day: `Day ${dayIndex + 1}`,
        }));
    });
  };

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  const fetchProgress = useCallback(async () => {
    try {
      setProgressLoading(true);
      const logs = await fetchProgressLogs(id);
      const normalizedLogs = Array.isArray(logs) ? logs : [];
      console.log("Logs:", normalizedLogs);
      setProgressLogs(normalizedLogs);
    } catch (error) {
      console.error("Error fetching progress logs:", error);
    } finally {
      setProgressLoading(false);
    }
  }, [id]);

  const fetchPatientPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      const data = await fetchPlansByPatient(id);
      setPatientPlans(id, data?.plans || []);
      return data?.plans || [];
    } catch (error) {
      console.error("Error fetching plans:", error);
      setPatientPlans(id, []);
      return [];
    } finally {
      setPlansLoading(false);
    }
  }, [id, setPatientPlans]);

  useEffect(() => {
    console.log("Logs:", progressLogs);
  }, [progressLogs]);

  const handleProgressFieldChange = (field, value) => {
    setProgressForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const hasManualMeals = days.some(
    (day) => day.breakfast || day.lunch || day.dinner
  );

  const handleGenerateWithAi = async () => {
    if (!goal.trim() || !dosha) {
      alert("Goal and dosha type are required before AI generation");
      return;
    }

    if (
      hasManualMeals &&
      !window.confirm(
        "This will replace the current meals in the builder. Continue?"
      )
    ) {
      return;
    }

    try {
      setIsGeneratingAi(true);

      const response = await generateAiPlan({
        patientId: id,
        goal: goal.trim(),
        doshaType: dosha,
        patientProfile: {
          age: patient?.age,
          weight: patient?.weight,
          gender: patient?.gender,
          conditions: patient?.healthConditions,
        },
      });
      const generatedMeals = response.meals || [];

      setDays(
        generatedMeals.length
          ? generatedMeals.map((meal, index) => ({
              day: meal.day || `Day ${index + 1}`,
              breakfast: meal.breakfast || "",
              lunch: meal.lunch || "",
              dinner: meal.dinner || "",
            }))
          : [createMealDay(0)]
      );
      setAutoFixChanges([]);
      setLastGeneratedContext(response.patientContext || null);
      setLastProgressInsights(response.progressInsights || []);
      showToast("Diet plan generated successfully");
    } catch (error) {
      console.error("Error generating diet plan:", error);
      alert(error.message || "Failed to generate diet plan");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAutoImprovePlan = async () => {
    if (!dosha) {
      alert("Select dosha type before improving the plan");
      return;
    }

    if (!days.some((day) => day.breakfast || day.lunch || day.dinner)) {
      alert("Add or generate meals before using auto improve");
      return;
    }

    if (
      !window.confirm(
        "This will replace the meals in the builder with an improved version. Continue?"
      )
    ) {
      return;
    }

    try {
      setIsImprovingPlan(true);

      const response = await fixAiPlan({
        meals: days,
        doshaType: dosha,
      });

      const improvedMeals = response.improvedMeals || [];
      setDays(
        improvedMeals.length
          ? improvedMeals.map((meal, index) => ({
              day: meal.day || `Day ${index + 1}`,
              breakfast: meal.breakfast || "",
              lunch: meal.lunch || "",
              dinner: meal.dinner || "",
            }))
          : days
      );
      setAutoFixChanges(response.changes || []);
      showToast("Plan improved successfully");
    } catch (error) {
      console.error("Error improving plan:", error);
      alert(error.message || "Failed to improve plan");
    } finally {
      setIsImprovingPlan(false);
    }
  };

  async function handleSubmitPlan() {
    const normalizedDays = days.map((day, index) => ({
      day: day.day.trim() || `Day ${index + 1}`,
      breakfast: day.breakfast.trim(),
      lunch: day.lunch.trim(),
      dinner: day.dinner.trim(),
    }));

    const hasInvalidDay = normalizedDays.some(
      (day) => !day.breakfast && !day.lunch && !day.dinner
    );

    if (!title.trim() || !dosha || !date) {
      alert("Title, dosha type, and review date are required");
      return;
    }

    if (normalizedDays.length === 0 || hasInvalidDay) {
      alert("Each day must include at least one meal");
      return;
    }

    try {
      if (editingPlanId) {
        const updatedPlan = await updatePlan(editingPlanId, {
          title: title.trim(),
          doshaType: dosha,
          reviewDueDate: date,
          meals: normalizedDays,
        });

        upsertPatientPlan(id, updatedPlan);
      } else {
        const createdPlan = await createPlan({
          patient: id,
          title: title.trim(),
          doshaType: dosha,
          reviewDueDate: date,
          meals: normalizedDays,
        });

        setPatientPlans(id, [createdPlan, ...visiblePlans]);
      }

      resetBuilder();
    } catch (error) {
      console.error("Error saving plan:", error);
      alert(error.message || "Failed to save plan");
    }
  }

  const handleSaveProgress = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in again to save progress");
      return;
    }

    if (!progressForm.weight || !progressForm.energyLevel || !progressForm.digestion) {
      alert("Weight, energy level, and digestion are required");
      return;
    }

    try {
      await createProgressLog({
        patient: id,
        patientId: id,
        weight: Number(progressForm.weight),
        energy: Number(progressForm.energyLevel),
        energyLevel: Number(progressForm.energyLevel),
        digestion: progressForm.digestion,
        adherence: progressForm.adherence ? 100 : 30,
        notes: progressForm.notes,
      });

      await Promise.all([fetchProgress(), fetchPatientPlans()]);
      setProgressForm((current) => ({
        ...current,
        energyLevel: "3",
        digestion: "good",
        adherence: false,
        notes: "",
      }));
      showToast("Progress log saved");
    } catch (error) {
      console.error("Error saving progress log:", error);
      alert(error.message || "Failed to save progress log");
    }
  };

  const handleSubmitProgress = async (event) => {
    event.preventDefault();
    await handleSaveProgress();
  };

  useEffect(() => {
    const loadPatient = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await fetchJson(`/patients/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPatient(data.patient || data);
      } catch (error) {
        console.error("Error loading patient details:", error);
      } finally {
        setPatientLoading(false);
      }
    };

    loadPatient();
  }, [id]);

  useEffect(() => {
    fetchPatientPlans();
  }, [fetchPatientPlans]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    if (!patient) {
      return;
    }

    setProgressForm((current) => ({
      ...current,
      weight: patient.weight || current.weight || "",
    }));
  }, [patient]);

  if (loading) {
    return <p className="text-neutral-400">Loading...</p>;
  }

  if (!patient) {
    return <p className="text-red-400">Patient not found</p>;
  }

  return (
    <div className="w-full space-y-8">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-green-600 px-4 py-2 text-white shadow-lg shadow-black/20">
          {toast}
        </div>
      )}

      <Link to="/dashboard" className="text-sm text-secondary hover:underline">
        Back to Dashboard
      </Link>

      <div className="space-y-10 rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl shadow-black/20 backdrop-blur-md md:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          {patient?.name}
        </h1>

        <Section title="Basic Information">
          <Info label="Age" value={`${patient?.age || "-"} yrs`} />
          <Info label="Gender" value={patient?.gender || "-"} />
          <Info
            label="Height"
            value={patient?.height ? `${patient.height} cm` : "-"}
          />
          <Info
            label="Weight"
            value={patient?.weight ? `${patient.weight} kg` : "-"}
          />
        </Section>

        <div className="mt-6 space-y-6 rounded-2xl border border-white/10 bg-gray-900/70 p-6 md:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">Active Diet Plan</h2>

            {!showForm && (
              <button
                onClick={() => {
                  resetBuilder();
                  setShowForm(true);
                }}
                className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-500"
              >
                Create Diet Plan
              </button>
            )}
          </div>

          {activePlan ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {activePlan.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Dosha: {activePlan.doshaType} | Review due:{" "}
                      {new Date(activePlan.reviewDueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEditingPlan(activePlan)}
                    className="text-sm font-medium text-blue-300 transition hover:text-blue-200"
                  >
                    Edit Plan
                  </button>
                </div>
              </div>

              <MealsList meals={activePlan.meals} />
              <PlanValidationCard
                validation={validatePlan(activePlan.meals, activePlan.doshaType)}
              />
            </div>
          ) : (
            <p className="text-gray-400">No active plan</p>
          )}

          {showForm && (
            <div className="mt-4 space-y-6 rounded-2xl border border-white/10 bg-black/35 p-6 md:p-7">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-2xl font-semibold text-white">
                  {editingPlanId ? "Editing Mode" : "Create Plan"}
                </h3>
                {editingPlanId && (
                  <span className="rounded-full border border-green-400/20 bg-green-500/10 px-3 py-1 text-sm text-green-300">
                    Updating existing plan
                  </span>
                )}
              </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <input
                  type="text"
                  placeholder="Plan Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-gray-900/90 px-4 py-3 text-white placeholder:text-gray-500 focus:border-green-500/50 focus:outline-none"
                />

                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-gray-900/90 px-4 py-3 text-white focus:border-green-500/50 focus:outline-none"
                >
                  <option value="">Select Goal</option>
                  <option value="weight loss">Weight Loss</option>
                  <option value="muscle gain">Muscle Gain</option>
                  <option value="better digestion">Better Digestion</option>
                  <option value="general wellness">General Wellness</option>
                </select>

                <select
                  value={dosha}
                  onChange={(e) => setDosha(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-gray-900/90 px-4 py-3 text-white focus:border-green-500/50 focus:outline-none"
                >
                  <option value="">Select Dosha</option>
                  <option value="vata">Vata</option>
                  <option value="pitta">Pitta</option>
                  <option value="kapha">Kapha</option>
                </select>

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-gray-900/90 px-4 py-3 text-white focus:border-green-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold text-white">
                      Meal Builder
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleGenerateWithAi}
                        disabled={isGeneratingAi}
                        className="rounded-xl border border-blue-500/60 px-4 py-2.5 text-sm font-medium text-blue-300 transition hover:bg-blue-500/10 disabled:opacity-60"
                      >
                        {isGeneratingAi
                          ? "Generating diet plan..."
                          : "Generate with AI"}
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoImprovePlan}
                        disabled={isImprovingPlan}
                        className="rounded-xl border border-amber-500/60 px-4 py-2.5 text-sm font-medium text-amber-300 transition hover:bg-amber-500/10 disabled:opacity-60"
                      >
                        {isImprovingPlan
                          ? "Improving plan..."
                          : "Auto Improve Plan"}
                      </button>
                      <button
                        type="button"
                        onClick={addDay}
                        className="rounded-xl border border-green-500/60 px-4 py-2.5 text-sm font-medium text-green-300 transition hover:bg-green-500/10"
                      >
                        Add Day
                      </button>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {days.map((day, index) => (
                      <div
                        key={`${day.day}-${index}`}
                        className="rounded-2xl border border-white/10 bg-gray-950/65 p-5 shadow-lg shadow-black/10 md:p-6"
                      >
                        <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                              Day Plan
                            </p>
                            <input
                              type="text"
                              value={day.day}
                              onChange={(e) =>
                                updateDayField(index, "day", e.target.value)
                              }
                              className="bg-transparent text-xl font-semibold text-white outline-none"
                            />
                          </div>

                          {days.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDay(index)}
                              className="text-sm font-medium text-red-300 transition hover:text-red-200"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <MealEditor
                            icon="Sunrise"
                            label="Breakfast"
                            value={day.breakfast}
                            onChange={(value) =>
                              updateDayField(index, "breakfast", value)
                            }
                          />
                          <MealEditor
                            icon="Sun"
                            label="Lunch"
                            value={day.lunch}
                            onChange={(value) =>
                              updateDayField(index, "lunch", value)
                            }
                          />
                          <MealEditor
                            icon="Moon"
                            label="Dinner"
                            value={day.dinner}
                            onChange={(value) =>
                              updateDayField(index, "dinner", value)
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-5 lg:col-span-1">
                  <PlanValidationCard validation={builderValidation} />

                  {autoFixChanges.length > 0 && (
                    <ChangesMadeCard changes={autoFixChanges} />
                  )}

                  <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                      Actions
                    </p>
                    <button
                      onClick={handleSubmitPlan}
                      className="w-full rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-500"
                    >
                      {editingPlanId ? "Save Changes" : "Save Plan"}
                    </button>
                    <button
                      type="button"
                      onClick={resetBuilder}
                      className="w-full rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {lastGeneratedContext && (
                  <div className="space-y-2 rounded-xl border border-blue-400/15 bg-blue-500/5 px-4 py-3">
                    <p className="text-sm text-blue-100">
                      Generated for: {lastGeneratedContext.goal} |{" "}
                      {lastGeneratedContext.doshaType} |{" "}
                      {lastGeneratedContext.weight} kg
                    </p>
                    {lastProgressInsights.length > 0 && (
                      <p className="text-xs text-blue-200/80">
                        Plan adjusted based on recent progress:{" "}
                        {lastProgressInsights.join(" | ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-gray-900/70 p-6 md:p-7">
          <h2 className="mb-4 text-2xl font-semibold text-white">Plan History</h2>

          {visiblePlans.length === 0 ? (
            <p className="text-gray-400">No plans found</p>
          ) : (
            <div className="space-y-4">
              {visiblePlans
                .filter((plan) => !plan.isActive)
                .map((plan) => {
                  const isExpanded = expandedPlanId === plan._id;

                  return (
                    <div
                      key={plan._id}
                      className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-5"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPlanId(isExpanded ? null : plan._id)
                        }
                        className="flex w-full items-center justify-between gap-4 text-left"
                      >
                        <div>
                          <p className="text-base font-medium text-white">
                            {plan.title}
                          </p>
                          <p className="text-sm text-gray-400">
                            {plan.status} | Created{" "}
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              startEditingPlan(plan);
                            }}
                            className="text-sm font-medium text-blue-300 transition hover:text-blue-200"
                          >
                            Edit Plan
                          </button>
                          <span className="text-sm text-green-300">
                            {isExpanded ? "Hide meals" : "View meals"}
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="space-y-4">
                          <MealsList meals={plan.meals} />
                          <PlanValidationCard
                            validation={validatePlan(plan.meals, plan.doshaType)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <Section title="Medical Details">
          <Info label="Conditions" value={patient?.healthConditions || "None"} />
          <Info
            label="Medications"
            value={patient?.currentMedications || "None"}
          />
          <Info label="Allergies" value={patient?.allergies || "None"} />
        </Section>

        <Section title="Ayurvedic Assessment">
          <Info label="Dominant Dosha" value={patient?.dosha || "-"} />
          <Info label="Diet Type" value={patient?.dietType || "-"} />
          <Info label="Activity Level" value={patient?.activityLevel || "-"} />
          <Info label="Preferences" value={patient?.preferences || "-"} />
        </Section>

        <div className="space-y-6 rounded-2xl border border-white/10 bg-gray-900/70 p-6 md:p-7">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-white">
              Progress Tracking
            </h2>
            <p className="text-sm text-gray-400">
              Track weight, energy, digestion, and adherence over time.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-white">Trend Summary</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <TrendCard
                label="Weight Trend"
                arrow={progressTrendSummary.weightTrend.arrow}
                value={progressTrendSummary.weightTrend.label}
              />
              <TrendCard
                label="Energy Trend"
                arrow={progressTrendSummary.energyTrend.arrow}
                value={progressTrendSummary.energyTrend.label}
              />
              <TrendCard
                label="Adherence"
                arrow={progressTrendSummary.adherence.arrow}
                value={progressTrendSummary.adherence.label}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <form
              onSubmit={handleSubmitProgress}
              className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-5"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-gray-300">Weight (kg)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={progressForm.weight}
                    onChange={(event) =>
                      handleProgressFieldChange("weight", event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-gray-900/90 px-4 py-3 text-white focus:border-green-500/50 focus:outline-none"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-gray-300">Energy Level</span>
                  <select
                    value={progressForm.energyLevel}
                    onChange={(event) =>
                      handleProgressFieldChange("energyLevel", event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-gray-900/90 px-4 py-3 text-white focus:border-green-500/50 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-gray-300">Digestion</span>
                  <select
                    value={progressForm.digestion}
                    onChange={(event) =>
                      handleProgressFieldChange("digestion", event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-gray-900/90 px-4 py-3 text-white focus:border-green-500/50 focus:outline-none"
                  >
                    <option value="good">Good</option>
                    <option value="bad">Bad</option>
                  </select>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-gray-900/60 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={progressForm.adherence}
                    onChange={(event) =>
                      handleProgressFieldChange("adherence", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  <span className="text-sm text-gray-300">
                    Patient followed the plan
                  </span>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm text-gray-300">Notes</span>
                <textarea
                  value={progressForm.notes}
                  onChange={(event) =>
                    handleProgressFieldChange("notes", event.target.value)
                  }
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-gray-900/90 px-4 py-3 text-white focus:border-green-500/50 focus:outline-none"
                  placeholder="Optional observations"
                />
              </label>

              <button
                type="button"
                onClick={handleSaveProgress}
                className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-500"
              >
                Save Progress
              </button>
            </form>

            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Recent Progress Logs
                </h3>
                <span className="text-sm text-gray-400">
                  {progressLogs.length} entries
                </span>
              </div>

              {progressLoading ? (
                <p className="text-sm text-gray-400">Loading progress logs...</p>
              ) : progressLogs.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No progress logs recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {progressLogs.map((log) => (
                    <div
                      key={log._id}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {log.plan?.title
                            ? `Active Plan: ${log.plan.title}`
                            : "Active Plan"}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-300">
                        <p>Weight: {log.weight ?? "-"}</p>
                        <p>Energy: {log.energyLevel ?? "-"}/5</p>
                        <p>Digestion: {log.digestion || "-"}</p>
                        <p>
                          Adherence:{" "}
                          {typeof log.adherence === "number"
                            ? `${log.adherence}%`
                            : log.adherence
                              ? "100%"
                              : "30%"}
                        </p>
                      </div>

                      {log.notes && (
                        <p className="mt-3 text-sm text-gray-400">{log.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientDetails;

function MealsList({ meals = [] }) {
  if (!meals.length) {
    return <p className="text-sm text-gray-400">No meals added.</p>;
  }

  return (
    <div className="space-y-4">
      {meals.map((mealDay, index) => (
        <div
          key={`${mealDay.day}-${index}`}
          className="rounded-2xl border border-white/10 bg-black/25 p-5 md:p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-white">{mealDay.day}</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <MealDisplay
              icon="Sunrise"
              label="Breakfast"
              value={mealDay.breakfast}
            />
            <MealDisplay icon="Sun" label="Lunch" value={mealDay.lunch} />
            <MealDisplay icon="Moon" label="Dinner" value={mealDay.dinner} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanValidationCard({ validation }) {
  if (!validation) {
    return null;
  }

  const { score, issues, suggestions } = validation;
  const badgeClasses =
    score < 5
      ? "bg-red-500/20 text-red-200"
      : score < 8
        ? "bg-yellow-500/20 text-yellow-100"
        : "bg-green-500/20 text-green-100";

  return (
    <div className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
            Validation
          </p>
          <p className="mt-1 text-lg font-semibold text-white">Plan Quality</p>
        </div>
        <div className={`rounded-full px-4 py-2 text-lg font-semibold ${badgeClasses}`}>
          Score: {score}/10
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-red-400/15 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-300">Warning Issues</p>
          <p className="text-xs text-red-200/70">Review these items first</p>
          {issues.length ? (
            <div className="space-y-2">
              {issues.map((issue) => (
                <p key={issue} className="text-sm text-red-100">
                  Warning {issue}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No major issues detected.</p>
          )}
        </div>

        <div className="space-y-2 rounded-xl border border-green-400/15 bg-green-500/5 p-4">
          <p className="text-sm font-medium text-green-300">Helpful Suggestions</p>
          <p className="text-xs text-green-200/70">
            Simple ways to improve balance
          </p>
          {suggestions.length ? (
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <p key={suggestion} className="text-sm text-green-100">
                  Check {suggestion}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">This plan looks well balanced.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChangesMadeCard({ changes }) {
  return (
    <div className="space-y-3 rounded-2xl border border-amber-400/15 bg-amber-500/10 p-5">
      <p className="text-base font-semibold text-white">Changes made:</p>
      <div className="space-y-2">
        {changes.map((change) => (
          <p key={change} className="text-sm text-amber-100">
            {change}
          </p>
        ))}
      </div>
    </div>
  );
}

function MealEditor({ icon, label, value, onChange }) {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gray-200">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-gray-500">Add meal details</p>
        </div>
      </div>

      <textarea
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-28 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white placeholder:text-gray-500 focus:border-green-500/50 focus:outline-none"
      />
    </div>
  );
}

function MealDisplay({ icon, label, value }) {
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gray-200">
          {icon}
        </div>
        <p className="text-sm font-medium text-white">{label}</p>
      </div>
      <p className="text-sm leading-6 text-gray-300">{value || "-"}</p>
    </div>
  );
}

function TrendCard({ label, arrow, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-2xl font-semibold text-white">{arrow}</span>
        <p className="text-base text-white/90">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h2 className="border-l-4 border-green-500 pl-3 text-xl font-semibold text-white">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{children}</div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-2 text-base text-white/90">{value}</p>
    </div>
  );
}
