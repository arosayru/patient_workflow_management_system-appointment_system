export const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function apiFetch(path, { method = 'GET', token, data } = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) {
    opts.headers['Authorization'] = `Bearer ${token}`;
  }
  if (data) {
    opts.body = JSON.stringify(data);
  }
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    json = {};
  }
  if (!res.ok) {
    const error = new Error(json.message || 'Request failed');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json;
}