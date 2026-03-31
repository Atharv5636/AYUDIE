const BASE_URL = "http://localhost:3000/plans";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchPendingPlans = async () => {
  const res = await fetch(`${BASE_URL}/pending`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const fetchPlansByPatient = async (patientId) => {
  const res = await fetch(`${BASE_URL}/patient/${patientId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const approvePlan = async (planId) => {
  const res = await fetch(`${BASE_URL}/${planId}/approve`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const rejectPlan = async (planId) => {
  const res = await fetch(`${BASE_URL}/${planId}/reject`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const createPlan = async (planPayload) => {
  const res = await fetch(`${BASE_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(planPayload),
  });

  const data = await res.json();
  return data.plan;
};

export const updatePlan = async (planId, planPayload) => {
  const res = await fetch(`${BASE_URL}/${planId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(planPayload),
  });

  const data = await res.json();
  return data.plan;
};

export const generateAiPlan = async (payload) => {
  const res = await fetch(`${BASE_URL}/generate-ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const fixAiPlan = async (payload) => {
  const res = await fetch(`${BASE_URL}/fix-ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};
