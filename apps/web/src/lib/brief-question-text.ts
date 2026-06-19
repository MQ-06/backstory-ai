/** Strip internal signal tags from brief question display text. */
export function displayBriefQuestionText(text: string): string {
  return text
    .replace(/\[(?:S|SI)\d+\]/gi, "")
    .replace(/\bticket_spike\b/gi, "linked tickets")
    .replace(/\bpatch_burst\b/gi, "patch burst")
    .replace(/\bsingle_owner\b/gi, "single-owner module")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\?/g, "?")
    .trim();
}

export function libraryAskQuestion(artifact: { name: string; kind: string }): string {
  switch (artifact.kind) {
    case "code":
      return `What should I know about \`${artifact.name}\`, especially anything tied to month-end payroll failures?`;
    case "ticket":
      return `What happened in ${artifact.name}, and what was the root cause?`;
    case "doc":
      return `What does ${artifact.name} say about month-end batch procedures and known workarounds?`;
    case "interview":
      return `What did the expert explain in ${artifact.name}? Include anything about workarounds or incidents.`;
    default:
      return `What should I know about ${artifact.name}?`;
  }
}
