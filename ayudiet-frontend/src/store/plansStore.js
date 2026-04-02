import { create } from "zustand";

const usePlansStore = create((set) => ({
  patientPlans: {},

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
    })),
}));

export default usePlansStore;
