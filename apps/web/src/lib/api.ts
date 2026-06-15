export type Engagement = {
  id: string;
  name: string;
  created_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchEngagements(token: string): Promise<Engagement[]> {
  return apiFetch<Engagement[]>("/api/v1/engagements", token);
}

export async function createEngagement(token: string, name: string): Promise<Engagement> {
  return apiFetch<Engagement>("/api/v1/engagements", token, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
