export type Engagement = {
  id: string;
  name: string;
  created_at: string;
};

export type SourceStatus = "queued" | "processing" | "indexed" | "error" | "draft";

export type SourceType = "git" | "tickets" | "docs" | "interview";

export type Source = {
  id: string;
  engagement_id: string;
  type: SourceType;
  name: string;
  status: SourceStatus;
  external_id: string | null;
  config: Record<string, unknown> | null;
  error_message: string | null;
  status_detail: string | null;
  created_at: string;
  updated_at: string;
};

/** Empty = same-origin (use API_PROXY_TARGET rewrite on Vercel). Local: http://localhost:8000 */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  if (!API_URL) return path;
  return `${API_URL}${path}`;
}

function apiReachabilityError(detail: string): string {
  if (!API_URL) {
    return `Cannot reach API (proxy). Set API_PROXY_TARGET on Vercel to your API host (${detail})`;
  }
  return `Cannot reach API at ${API_URL}. Start it with: make dev-api (${detail})`;
}

async function apiFetch<T>(
  path: string,
  token: string | null,
  options: RequestInit = {},
): Promise<T> {
  if (!token) {
    throw new Error("Not signed in — refresh the page and try again.");
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(apiReachabilityError(detail));
  }

  if (!response.ok) {
    const body = await response.text();
    let message = body || `API error ${response.status}`;
    try {
      const parsed = JSON.parse(body) as { detail?: string };
      if (parsed.detail) message = parsed.detail;
    } catch {
      // keep raw body
    }
    if (response.status === 409) {
      message = "This source is already connected. Use re-sync on the row below.";
    }
    throw new Error(message);
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

export async function deleteEngagement(token: string, engagementId: string): Promise<void> {
  if (!token) {
    throw new Error("Not signed in — refresh the page and try again.");
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/v1/engagements/${engagementId}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(apiReachabilityError(detail));
  }

  if (!response.ok) {
    const body = await response.text();
    let message = body || `API error ${response.status}`;
    try {
      const parsed = JSON.parse(body) as { detail?: string };
      if (parsed.detail) message = parsed.detail;
    } catch {
      // keep raw body
    }
    throw new Error(message);
  }
}

export async function fetchSources(token: string, engagementId: string): Promise<Source[]> {
  return apiFetch<Source[]>(`/api/v1/engagements/${engagementId}/sources`, token);
}

export async function createGitSource(
  token: string,
  engagementId: string,
  repoUrl: string,
): Promise<Source> {
  return apiFetch<Source>(`/api/v1/engagements/${engagementId}/sources`, token, {
    method: "POST",
    body: JSON.stringify({ type: "git", repo_url: repoUrl }),
  });
}

export async function createTicketSource(
  token: string,
  engagementId: string,
  projectKey: string,
): Promise<Source> {
  return apiFetch<Source>(`/api/v1/engagements/${engagementId}/sources`, token, {
    method: "POST",
    body: JSON.stringify({ type: "tickets", project_key: projectKey }),
  });
}

export async function uploadDocSource(
  token: string,
  engagementId: string,
  file: File,
): Promise<Source> {
  if (!token) {
    throw new Error("Not signed in — refresh the page and try again.");
  }

  const form = new FormData();
  form.append("file", file);
  let response: Response;
  try {
    response = await fetch(
      apiUrl(`/api/v1/engagements/${engagementId}/sources/docs/upload`),
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      },
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(apiReachabilityError(detail));
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `API error ${response.status}`);
  }
  return response.json() as Promise<Source>;
}

export async function resyncSource(
  token: string,
  engagementId: string,
  sourceId: string,
): Promise<Source> {
  return apiFetch<Source>(
    `/api/v1/engagements/${engagementId}/sources/${sourceId}/sync`,
    token,
    { method: "POST" },
  );
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl("/api/health"));
    return res.ok;
  } catch {
    return false;
  }
}

export type AskCitation = {
  id?: string;
  passage_id?: number;
  chunk_id?: string;
  citation_type: string;
  label: string;
  snippet?: string;
  locator?: Record<string, unknown> | null;
  final?: boolean;
};

export type AskDoneEvent = {
  answer_id: string;
  refused: boolean;
  answer_text?: string;
  citations?: AskCitation[];
};

type StreamAskHandlers = {
  token: string;
  engagementId: string;
  question: string;
  signal?: AbortSignal;
  onStatus?: (status: string) => void;
  onToken?: (token: string) => void;
  onCitation?: (citation: AskCitation) => void;
  onRefusal?: (reason: string) => void;
  onError?: (message: string) => void;
  onDone?: (event: AskDoneEvent) => void;
};

function parseSseBlock(block: string): { event: string; data: string } | null {
  let event = "message";
  let data = "";
  for (const rawLine of block.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!data && event === "message") return null;
  return { event, data };
}

export async function streamAsk(handlers: StreamAskHandlers): Promise<void> {
  const { token, engagementId, question, signal } = handlers;

  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/v1/engagements/${engagementId}/ask`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ question }),
      signal,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(apiReachabilityError(detail));
  }

  if (!response.ok) {
    const body = await response.text();
    let message = body || `API error ${response.status}`;
    try {
      const parsed = JSON.parse(body) as { detail?: string };
      if (parsed.detail) message = parsed.detail;
    } catch {
      // keep raw body
    }
    throw new Error(message);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Streaming not supported in this browser");

  const decoder = new TextDecoder();
  let buffer = "";
  let sawTerminal = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split(/\r?\n\r?\n/);
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const parsed = parseSseBlock(part.trim());
      if (!parsed) continue;

      const { event, data } = parsed;
      if (event === "status") {
        handlers.onStatus?.(data);
        continue;
      }
      if (event === "token") {
        sawTerminal = true;
        handlers.onToken?.(data);
        continue;
      }
      if (event === "error") {
        sawTerminal = true;
        handlers.onError?.(data);
        continue;
      }
      if (event === "refusal") {
        sawTerminal = true;
        try {
          const payload = JSON.parse(data) as { reason?: string };
          handlers.onRefusal?.(payload.reason ?? data);
        } catch {
          handlers.onRefusal?.(data);
        }
        continue;
      }
      if (event === "citation") {
        try {
          handlers.onCitation?.(JSON.parse(data) as AskCitation);
        } catch {
          // ignore malformed citation events
        }
        continue;
      }
      if (event === "done") {
        sawTerminal = true;
        try {
          const payload = JSON.parse(data) as AskDoneEvent & { error?: string };
          if (payload.error) handlers.onError?.(payload.error);
          handlers.onDone?.(payload);
        } catch {
          handlers.onDone?.({ answer_id: "", refused: false });
        }
      }
    }
  }

  if (!sawTerminal) {
    handlers.onError?.("Ask stream ended without a response — check API logs and Gemini quota.");
  }
}

export type BriefQuestion = {
  id: string;
  rank: number;
  question_text: string;
  evidence: Record<string, unknown> | null;
};

export type ArchaeologyBrief = {
  id: string;
  engagement_id: string;
  expert_name: string | null;
  module_path: string | null;
  status: string;
  signals: Record<string, unknown>[] | null;
  error_message: string | null;
  created_at: string;
  questions: BriefQuestion[];
};

export type TranscriptSegment = {
  id: string;
  segment_index: number;
  start_seconds: number;
  end_seconds: number;
  text: string;
};

export type Interview = {
  id: string;
  engagement_id: string;
  brief_id: string | null;
  title: string;
  expert_name: string | null;
  status: string;
  status_detail: string | null;
  error_message: string | null;
  media_mime: string | null;
  duration_seconds: number | null;
  consent_at: string | null;
  created_at: string;
  segments: TranscriptSegment[];
};

export async function fetchBriefs(token: string, engagementId: string): Promise<ArchaeologyBrief[]> {
  return apiFetch<ArchaeologyBrief[]>(`/api/v1/engagements/${engagementId}/briefs`, token);
}

export async function generateBrief(
  token: string,
  engagementId: string,
  payload: { expert_name?: string; module_path?: string },
): Promise<ArchaeologyBrief> {
  return apiFetch<ArchaeologyBrief>(`/api/v1/engagements/${engagementId}/briefs`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchInterviews(token: string, engagementId: string): Promise<Interview[]> {
  return apiFetch<Interview[]>(`/api/v1/engagements/${engagementId}/interviews`, token);
}

export async function createInterview(
  token: string,
  engagementId: string,
  payload: { title: string; expert_name?: string; brief_id?: string },
): Promise<Interview> {
  return apiFetch<Interview>(`/api/v1/engagements/${engagementId}/interviews`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function recordInterviewConsent(
  token: string,
  engagementId: string,
  interviewId: string,
): Promise<Interview> {
  return apiFetch<Interview>(
    `/api/v1/engagements/${engagementId}/interviews/${interviewId}/consent`,
    token,
    { method: "POST" },
  );
}

export async function uploadInterviewMedia(
  token: string,
  engagementId: string,
  interviewId: string,
  file: File,
): Promise<Interview> {
  if (!token) throw new Error("Not signed in");
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(
    apiUrl(`/api/v1/engagements/${engagementId}/interviews/${interviewId}/upload`),
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form },
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Upload failed ${response.status}`);
  }
  return response.json() as Promise<Interview>;
}

export async function transcribeInterview(
  token: string,
  engagementId: string,
  interviewId: string,
): Promise<Interview> {
  return apiFetch<Interview>(
    `/api/v1/engagements/${engagementId}/interviews/${interviewId}/transcribe`,
    token,
    { method: "POST" },
  );
}

export async function getInterviewMediaBlobUrl(
  token: string,
  engagementId: string,
  interviewId: string,
): Promise<string> {
  const response = await fetch(
    apiUrl(`/api/v1/engagements/${engagementId}/interviews/${interviewId}/media`),
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error("Could not load interview media");
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export type LibraryLink = {
  label: string;
  variant: "code" | "ticket" | "interview" | "doc";
};

export type LibraryArtifact = {
  id: string;
  name: string;
  kind: "code" | "ticket" | "interview" | "doc";
  meta: string;
  chunk_count: number;
  link_count: number;
  last_modified: string | null;
  authors: string | null;
  lines: string | null;
  links: LibraryLink[];
};

export type LibrarySummary = {
  total: number;
  code: number;
  ticket: number;
  interview: number;
  doc: number;
};

export type LibraryResponse = {
  artifacts: LibraryArtifact[];
  summary: LibrarySummary;
};

export async function fetchLibrary(
  token: string,
  engagementId: string,
  params?: { kind?: string; q?: string },
): Promise<LibraryResponse> {
  const search = new URLSearchParams();
  if (params?.kind) search.set("kind", params.kind);
  if (params?.q) search.set("q", params.q);
  const qs = search.toString();
  return apiFetch<LibraryResponse>(
    `/api/v1/engagements/${engagementId}/library${qs ? `?${qs}` : ""}`,
    token,
  );
}

export type EngagementStats = {
  source_count: number;
  indexed_source_count: number;
  last_indexed_at: string | null;
};

export async function fetchEngagementStats(
  token: string,
  engagementId: string,
): Promise<EngagementStats> {
  const sources = await fetchSources(token, engagementId);
  const indexed = sources.filter((s) => s.status === "indexed");
  const dates = indexed
    .map((s) => s.updated_at)
    .filter(Boolean)
    .sort()
    .reverse();
  return {
    source_count: sources.length,
    indexed_source_count: indexed.length,
    last_indexed_at: dates[0] ?? null,
  };
}

