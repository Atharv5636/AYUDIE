import { fetchJson } from "./api";

export async function createProgressLog(payload) {
  const token = localStorage.getItem("token");

  return fetchJson("/progress", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchProgressLogs(patientId) {
  const token = localStorage.getItem("token");

  const data = await fetchJson(`/progress/${patientId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return Array.isArray(data.logs) ? data.logs : [];
}
