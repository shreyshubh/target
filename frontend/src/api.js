// Shared API helper
const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const USER_ID = 'guest';

export async function fetchProgress() {
  const res = await fetch(`${BASE_URL}/progress/${USER_ID}`);
  if (!res.ok) throw new Error('Failed to fetch progress');
  return res.json(); // { "dsa::Arrays & Strings::0": true, ... }
}

export async function saveProgress(progressObj) {
  const res = await fetch(`${BASE_URL}/progress/${USER_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progress: progressObj }),
  });
  if (!res.ok) throw new Error('Failed to save progress');
  return res.json();
}

// --- Todo API ---
export async function fetchTodos() {
  const res = await fetch(`${BASE_URL}/todos`);
  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json();
}

export async function createTodo(payload) {
  const res = await fetch(`${BASE_URL}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create todo');
  return res.json();
}

export async function toggleTodo(id, completed) {
  const res = await fetch(`${BASE_URL}/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) throw new Error('Failed to update todo');
  return res.json();
}

export async function updateTodo(id, updates) {
  const res = await fetch(`${BASE_URL}/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update todo');
  return res.json();
}

export async function reorderTodosBulk(updates) {
  const res = await fetch(`${BASE_URL}/todos/reorder/bulk`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });
  if (!res.ok) throw new Error('Failed to reorder todos');
  return res.json();
}

export async function deleteTodo(id) {
  const res = await fetch(`${BASE_URL}/todos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete todo');
  return res.json();
}

// --- Attendance API ---
export async function fetchAttendance() {
  const res = await fetch(`${BASE_URL}/attendance`);
  if (!res.ok) throw new Error('Failed to fetch attendance');
  return res.json();
}

export async function updateSubjects(subjects) {
  const res = await fetch(`${BASE_URL}/attendance/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subjects }),
  });
  if (!res.ok) throw new Error('Failed to update subjects');
  return res.json();
}

export async function updateTimetable(timetable) {
  const res = await fetch(`${BASE_URL}/attendance/timetable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timetable }),
  });
  if (!res.ok) throw new Error('Failed to update timetable');
  return res.json();
}

export async function updateDailyRecord(date, subjectId, status) {
  const res = await fetch(`${BASE_URL}/attendance/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, subjectId, status }),
  });
  if (!res.ok) throw new Error('Failed to update daily record');
  return res.json();
}

export async function saveBulkRecords(records) {
  const res = await fetch(`${BASE_URL}/attendance/records/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records }),
  });
  if (!res.ok) throw new Error('Failed to save bulk records');
  return res.json();
}

export async function toggleHoliday(date) {
  const res = await fetch(`${BASE_URL}/attendance/holidays/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date }),
  });
  if (!res.ok) throw new Error('Failed to toggle holiday');
  return res.json();
}
