import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Normalize unknown thrown/rejected values — avoids "[object Event]" in UI and overlays. */
export function formatErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error) return err.message || fallback
  if (typeof err === "string") return err || fallback
  if (err && typeof err === "object") {
    if ("message" in err && typeof (err as { message: unknown }).message === "string") {
      const msg = (err as { message: string }).message
      if (msg) return msg
    }
    // DOM Event / ProgressEvent rejections (e.g. Clerk script load failures)
    if (typeof Event !== "undefined" && err instanceof Event) {
      return fallback
    }
  }
  const asString = String(err)
  if (asString === "[object Event]" || asString === "[object Object]") return fallback
  return asString || fallback
}
