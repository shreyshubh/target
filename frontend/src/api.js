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
