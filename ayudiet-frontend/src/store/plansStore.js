import { create } from "zustand";

const getPatientId = (plan) =>
  typeof plan?.patient === "object" ? plan.patient?._id : plan?.patient;

const normalizeApprovedPlans = (plans, approvedPlan) => {
  const remainingPlans = plans.filter((plan) => plan._id !== approvedPlan._id);

  return [
    {
      ...approvedPlan,
      patient: getPatientId(approvedPlan),
      status: "approved",
      isActive: true,
    },
    ...remainingPlans.map((plan) => ({ ...plan, isActive: false })),
  ];
};

const usePlansStore = create((set, get) => ({
  plans: [],
  patientPlans: {},

  setPlans: (plans) => set({ plans }),

  removePlan: (planId) =>
    set((state) => ({
      plans: state.plans.filter((plan) => plan._id !== planId),
    })),

  setPatientPlans: (patientId, plans) =>
    set((state) => ({
      patientPlans: {
        ...state.patientPlans,
        [patientId]: plans,
      },
    })),

  upsertPatientPlan: (patientId, updatedPlan) =>
    set((state) => ({
      patientPlans: {
        ...state.patientPlans,
        [patientId]: (state.patientPlans[patientId] || []).map((plan) =>
          plan._id === updatedPlan._id ? updatedPlan : plan
        ),
      },
      plans: state.plans.map((plan) =>
        plan._id === updatedPlan._id ? updatedPlan : plan
      ),
    })),

  updateActivePlan: (patientId, approvedPlan) =>
    set((state) => ({
      patientPlans: {
        ...state.patientPlans,
        [patientId]: normalizeApprovedPlans(
          state.patientPlans[patientId] || [],
          {
            ...approvedPlan,
            patient: patientId,
          }
        ),
      },
    })),

  approvePlanLocalUpdate: (approvedPlan) => {
    const patientId = getPatientId(approvedPlan);
    if (!patientId) {
      return;
    }

    get().removePlan(approvedPlan._id);
    get().updateActivePlan(patientId, approvedPlan);
  },
}));

export default usePlansStore;
