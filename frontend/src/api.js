// Shared API helper — cookie-based auth (httpOnly)
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ── Auto-logout on 401 ─────────────────────────────────────
function handleUnauthorized(res) {
  if (res.status === 401) {
    // Cookie is already gone (server clears it), just redirect
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }
}

async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',   // Always send httpOnly cookie
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  handleUnauthorized(res);
  return res;
}

// ── Auth API ────────────────────────────────────────────────
export async function apiLogin(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function apiRegister(username, email, password) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function apiForgotPassword(email) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function apiResetPassword(email, code, newPassword) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Reset failed');
  return data;
}

export async function apiChangePassword(currentPassword, newPassword) {
  const res = await authFetch(`${BASE_URL}/auth/change-password`, {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Change failed');
  return data;
}

export async function apiUpdateProfile(updates) {
  const res = await authFetch(`${BASE_URL}/auth/profile`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Update failed');
  return data;
}

export async function apiDeleteAccount(password) {
  const res = await authFetch(`${BASE_URL}/auth/account`, {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Delete failed');
  return data;
}

export async function apiLogout() {
  const res = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Logout failed');
  return data;
}

// Check current session by asking the server (passive verification)
export async function apiCheckSession() {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    credentials: 'include',
  });
  if (!res.ok) return null;  // Not logged in
  return res.json();
}

// ── Progress API ────────────────────────────────────────────
export async function fetchProgress() {
  const res = await authFetch(`${BASE_URL}/progress`);
  if (!res.ok) throw new Error('Failed to fetch progress');
  return res.json();
}

export async function saveProgress(progressObj) {
  const res = await authFetch(`${BASE_URL}/progress`, {
    method: 'POST',
    body: JSON.stringify({ progress: progressObj }),
  });
  if (!res.ok) throw new Error('Failed to save progress');
  return res.json();
}

// ── Syllabus API ────────────────────────────────────────────
export async function fetchSyllabus() {
  const res = await authFetch(`${BASE_URL}/syllabus`);
  if (!res.ok) throw new Error('Failed to fetch syllabus');
  return res.json();
}

export async function saveSyllabus(tracks) {
  const res = await authFetch(`${BASE_URL}/syllabus`, {
    method: 'POST',
    body: JSON.stringify({ tracks }),
  });
  if (!res.ok) throw new Error('Failed to save syllabus');
  return res.json();
}

export async function addTrack(id, label) {
  const res = await authFetch(`${BASE_URL}/syllabus/track`, {
    method: 'POST',
    body: JSON.stringify({ id, label }),
  });
  if (!res.ok) throw new Error('Failed to add track');
  return res.json();
}

export async function updateTrack(trackId, data) {
  const res = await authFetch(`${BASE_URL}/syllabus/track/${trackId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update track');
  return res.json();
}

export async function deleteTrack(trackId) {
  const res = await authFetch(`${BASE_URL}/syllabus/track/${trackId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete track');
  return res.json();
}

export async function addSection(trackId, title, topics) {
  const res = await authFetch(`${BASE_URL}/syllabus/track/${trackId}/section`, {
    method: 'POST',
    body: JSON.stringify({ title, topics }),
  });
  if (!res.ok) throw new Error('Failed to add section');
  return res.json();
}

// ── Todo API ────────────────────────────────────────────────
export async function fetchTodos() {
  const res = await authFetch(`${BASE_URL}/todos`);
  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json();
}

export async function createTodo(payload) {
  const res = await authFetch(`${BASE_URL}/todos`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create todo');
  return res.json();
}

export async function toggleTodo(id, completed) {
  const res = await authFetch(`${BASE_URL}/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) throw new Error('Failed to update todo');
  return res.json();
}

export async function updateTodo(id, updates) {
  const res = await authFetch(`${BASE_URL}/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update todo');
  return res.json();
}

export async function reorderTodosBulk(updates) {
  const res = await authFetch(`${BASE_URL}/todos/reorder/bulk`, {
    method: 'PUT',
    body: JSON.stringify({ updates }),
  });
  if (!res.ok) throw new Error('Failed to reorder todos');
  return res.json();
}

export async function deleteTodo(id) {
  const res = await authFetch(`${BASE_URL}/todos/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete todo');
  return res.json();
}

// ── Attendance API ──────────────────────────────────────────
export async function fetchAttendance() {
  const res = await authFetch(`${BASE_URL}/attendance`);
  if (!res.ok) throw new Error('Failed to fetch attendance');
  return res.json();
}

export async function updateSubjects(subjects) {
  const res = await authFetch(`${BASE_URL}/attendance/subjects`, {
    method: 'POST',
    body: JSON.stringify({ subjects }),
  });
  if (!res.ok) throw new Error('Failed to update subjects');
  return res.json();
}

export async function updateTimetable(timetable) {
  const res = await authFetch(`${BASE_URL}/attendance/timetable`, {
    method: 'POST',
    body: JSON.stringify({ timetable }),
  });
  if (!res.ok) throw new Error('Failed to update timetable');
  return res.json();
}

export async function updateDailyRecord(date, subjectId, status) {
  const res = await authFetch(`${BASE_URL}/attendance/records`, {
    method: 'POST',
    body: JSON.stringify({ date, subjectId, status }),
  });
  if (!res.ok) throw new Error('Failed to update daily record');
  return res.json();
}

export async function saveBulkRecords(records) {
  const res = await authFetch(`${BASE_URL}/attendance/records/bulk`, {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
  if (!res.ok) throw new Error('Failed to save bulk records');
  return res.json();
}

export async function toggleHoliday(date) {
  const res = await authFetch(`${BASE_URL}/attendance/holidays/toggle`, {
    method: 'POST',
    body: JSON.stringify({ date }),
  });
  if (!res.ok) throw new Error('Failed to toggle holiday');
  return res.json();
}

