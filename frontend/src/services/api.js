const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function getAuthToken() {
  return localStorage.getItem('donezo_token');
}

function getErrorMessage(errorBody, fallback) {
  if (!errorBody) return fallback;
  if (typeof errorBody === 'string') return errorBody;
  if (errorBody.message) return errorBody.message;
  if (errorBody.details) {
    return Object.values(errorBody.details).join(', ');
  }
  return fallback;
}

export async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Cannot connect to the server. Please make sure the backend is running.');
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
    throw new Error(getErrorMessage(body, `Request failed with status ${response.status}`));
  }

  return body;
}

export { API_BASE_URL };
