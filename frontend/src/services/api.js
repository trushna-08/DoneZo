const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

function getAuthToken() {
  return localStorage.getItem("donezo_token");
}

function getErrorMessage(errorBody, fallback) {
  if (!errorBody) return fallback;

  if (typeof errorBody === "string") return errorBody;

  if (errorBody.message) return errorBody.message;

  if (errorBody.error) return errorBody.error;

  if (errorBody.details) {
    return Object.values(errorBody.details).join(", ");
  }

  return fallback;
}

export async function apiRequest(path, options = {}) {
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const cleanBaseUrl = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  let response;

  try {
    response = await fetch(`${cleanBaseUrl}${cleanPath}`, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error("API connection error:", error);
    throw new Error(
      "Cannot connect to the server. Please check backend URL or internet connection."
    );
  }

  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(body, `Request failed with status ${response.status}`)
    );
  }

  return body;
}

export { API_BASE_URL };
