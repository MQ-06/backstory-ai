"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

import { getInterviewMediaBlobUrl } from "@/lib/api";
import { formatErrorMessage } from "@/lib/utils";

type VideoClipPlayerProps = {
  engagementId: string;
  interviewId: string;
  startSeconds?: number;
  snippet?: string;
  label?: string;
};

export function VideoClipPlayer({
  engagementId,
  interviewId,
  startSeconds = 0,
  snippet,
  label,
}: VideoClipPlayerProps) {
  const { getToken } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      try {
        const token = await getToken();
        if (!token) throw new Error("Not signed in");
        objectUrl = await getInterviewMediaBlobUrl(token, engagementId, interviewId);
        if (!cancelled) setSrc(objectUrl);
      } catch (err) {
        if (!cancelled) {
          setError(formatErrorMessage(err, "Could not load clip"));
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [engagementId, interviewId, getToken]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const seek = () => {
      if (startSeconds > 0) video.currentTime = startSeconds;
    };
    video.addEventListener("loadedmetadata", seek);
    return () => video.removeEventListener("loadedmetadata", seek);
  }, [src, startSeconds]);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!src) {
    return <p className="text-sm text-muted-foreground">Loading clip…</p>;
  }

  return (
    <div className="space-y-3">
      {label ? <p className="text-sm font-medium">{label}</p> : null}
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full rounded-lg border border-border"
        onError={() => setError("Could not play interview clip")}
      />
      {snippet ? (
        <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{snippet}</p>
      ) : null}
    </div>
  );
}
