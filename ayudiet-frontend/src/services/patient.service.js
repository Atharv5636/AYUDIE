import { fetchJson } from "./api";

function getAuthHeaders(includeJsonContentType = false) {
  const token = localStorage.getItem("token");

  return {
    ...(includeJsonContentType ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchPatientById(patientId) {
  const response = await fetchJson(`/patients/${patientId}`, {
    headers: getAuthHeaders(),
  });

  return response.patient || response;
}

export async function updatePatient(patientId, payload) {
  const response = await fetchJson(`/patients/${patientId}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  return response.patient || response;
}

export async function deletePatient(patientId) {
  return fetchJson(`/patients/${patientId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}
