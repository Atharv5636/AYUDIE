import { fetchJson } from "./api";

export async function fetchDashboardStats() {
  const token = localStorage.getItem("token");

  return fetchJson("/health/dashboard-stats", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
