export const API_BASE_URL = "http://localhost:3000";

export async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(text || "Expected JSON response from server");
  }

  return response.json();
}

export async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  return parseJsonResponse(response);
}
