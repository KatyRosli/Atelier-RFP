// In dev/same-origin deployments (Express serving the built frontend itself),
// leave VITE_API_BASE_URL unset and requests stay relative ("/api/..").
// When the frontend and backend are deployed separately (Vercel + Railway),
// set VITE_API_BASE_URL to the backend's origin, e.g. https://my-backend.up.railway.app
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
