<div align="center">

<img src=".github/assets/readme-banner.svg" alt="Backstory — the memory layer for legacy systems" width="920" />

<br />

### Code tells you *what*. Backstory remembers *why*.

<a href="https://backstory-ai.vercel.app">
  <img src="https://img.shields.io/badge/→_Try_it_live-backstory--ai.vercel.app-d4954a?style=for-the-badge&labelColor=1a1410&color=f0ebe3" alt="Try it live" />
</a>
&nbsp;
<img src="https://img.shields.io/badge/status-MVP_build-c8853a?style=for-the-badge&labelColor=1a1410" alt="status" />

<br /><br />

[**Try it**](https://backstory-ai.vercel.app) · [The problem](#the-problem-nobody-documents) · [How it works](#how-it-works) · [Three horizons](#the-three-horizons) · [Tech stack](#tech-stack) · [Architecture](#architecture) · [After the MVP](#after-the-mvp) · [Run locally](#run-it-locally) · [License](#license)

</div>

<br />

> **Why does the payroll job fail on months with 31 days?**
>
> Maya types that into Backstory before any interview has ever been recorded. Eight seconds later she has an answer: the root cause traces to a 2011 banking API workaround, cited to ticket `#4821` and commit `a7f3c2`. She clicks the ticket. She clicks the code. Both open at the exact line.
>
> That moment — a real answer to a question that used to mean tracking down someone who half-remembers, or someone who's already retired — is the entire bet this product is built on.

<br />

---

## The problem nobody documents

Every legacy system is haunted by decisions nobody remembers making. Why is the retry count `7`? Why must that date check never be removed? Why does the payroll job choke every December?

Somebody knew. They retired. They quit. They moved teams. The answer didn't leave with malice — it just left, the way undocumented knowledge always does, quietly and all at once, usually a few weeks before an audit asks for it in writing.

The code still runs. It just stopped explaining itself a long time ago.

**Backstory is the memory layer that captures the *why* before it walks out the door** — from years of commits and tickets nobody re-reads, from AI-guided interviews with the people about to leave, and from every incident fix as it happens — and answers questions about it in plain English, with proof you can click on.

No source, no claim. Ever. If the memory genuinely doesn't know, it says so.

<br />

## Why this, why now

| | |
|---|---|
| **The retirement cliff** | The engineers who built and patched COBOL, early Java, and bespoke ERP systems through the '90s and 2000s are retiring on a clock that doesn't pause for your modernization roadmap. |
| **The modernization wave** | Banks, insurers, and governments are under real regulatory pressure to modernize core systems they no longer fully understand — and "we don't know why it works" is not an answer an auditor accepts. |
| **AI finally makes it tractable** | Frontier LLMs, cheap accurate transcription, and vector retrieval mean linking decades of unstructured tribal knowledge to specific lines of code is, for the first time, actually buildable. |

<br />

---

## 🕰 The three horizons

Most tools cover one slice of a system's history. Backstory is built around the idea that knowledge has to be captured at **three different points in time**, and that no single one of them is enough on its own.

<table width="100%">
<tr>
<td width="33%" align="center" valign="top">

### Horizon 1 — The Past
**Everything that already happened.**

Git history back to day one. Every ticket and its resolution. Runbooks, PDFs, the Confluence export nobody opens anymore. This data already exists in your systems right now — Backstory ingests it and creates value before a single interview is recorded.

</td>
<td width="33%" align="center" valign="top">

### Horizon 2 — The Leaving
**The expert, before they're gone.**

Not a generic exit interview. Backstory reads the codebase first — the files patched 47 times, the 3am emergency commits, the single-owner modules — and generates questions only that person could answer. Ahmed's reaction is always the same: *"How does it know about that?"*

</td>
<td width="33%" align="center" valign="top">

### Horizon 3 — The Present
**The memory that never stops growing.**

Every incident that gets resolved becomes part of the record — the fix, the ticket, who did it — captured automatically, linked to the code it touched. Zero extra effort from anyone. After a year of this, the knowledge base is something no competitor can replicate by showing up later.

</td>
</tr>
</table>

<div align="center">
<sub>Past + Leaving + Present — together, not separately. That combination is the moat.</sub>
</div>

<br />

---

## ⚡ How it works

<div align="center">
<img src=".github/assets/readme-flow.svg" alt="Connect sources, ask a question, get an Answer Receipt or an honest refusal" width="920" />
</div>

<br />

**1. Connect.** GitHub or GitLab, Jira/Linear/GitHub Issues, and any PDFs, Word docs, or runbooks worth saving. Each source shows live status — `Queued → Processing → Indexed`, or a clear `Error` you can actually act on.

**2. Ask.** One chat box. Plain English, or Urdu. No query syntax, no "select your data source first."

```
"Why does the payroll job fail on months with 31 days?"
```

**3. Get proof, not prose.** The answer streams in token by token. Every claim in it is backed by a clickable **Answer Receipt** — the exact code line, the ticket number, the video clip that opens at the precise second an engineer explains it.

```
payroll_calc.py:142  ·  JIRA-4821  ·  Ahmed's interview @ 14:32
```

Click any of them. They open at the exact location. Not "somewhere in this file" — line 142.

**4. Or get an honest no.** If the memory genuinely doesn't contain the answer, Backstory says **"I don't have this."** Not a guess dressed up as confidence. The refusal card is as polished as a successful answer, and it always offers the next move: start an interview, or upload the missing document. Every gap becomes a prompt to fix the gap.

> **This rule has no setting to turn it off.** One confident hallucination is enough to destroy trust in everything else the system says. So refusal isn't a fallback — it's load-bearing.

<br />

---

## 🎙 The Archaeology Brief

This is the feature that makes people stop and ask *"wait, how did it know that?"*

Before anyone sits down to interview a departing expert, Backstory studies the system on its own: which files get patched constantly, which ones only one person has ever touched, where the 3am emergency commits cluster, where ticket density spikes without explanation. It turns those risk signals into a short list of sharp, specific questions — the kind a generic "tell us everything you know" exit interview never gets to.

<table width="100%"><tr><td>

**Ahmed** has 22 years on the system and 90 days until he retires. He's done the generic knowledge-transfer sessions before — they're exhausting and go nowhere. Backstory hands him something different: *"You touched `payroll_calc.py` 47 times, mostly in December. What broke?"*

He didn't expect the question to be that specific. That surprise — **"how does it know about that?"** — is the product working exactly as intended.

His answer is recorded on video, every sentence timestamped. Two years from now, when someone else hits the same wall at 2am, the clip is waiting for them, already linked to the line of code it explains.

</td></tr></table>

<br />

---

## 🎨 Tech stack

<div align="center">
<img src=".github/assets/readme-stack.svg" alt="Architecture diagram — Next.js, FastAPI, Postgres with pgvector, Redis, Groq" width="920" />
</div>

<br />

---

## 🧭 Architecture

The part that actually matters isn't any single piece of the stack above — it's the **double grounding gate** that sits between retrieval and generation. The model is never allowed to answer from evidence that isn't there.

```mermaid
%%{init: {'theme':'base', 'themeVariables': {
  'primaryColor': '#1e1a15',
  'primaryTextColor': '#f0ebe3',
  'primaryBorderColor': '#d4954a',
  'lineColor': '#c8853a',
  'secondaryColor': '#2d6a4f',
  'tertiaryColor': '#1a1410',
  'background': '#12100d',
  'mainBkg': '#1e1a15',
  'nodeTextColor': '#f0ebe3',
  'fontFamily': 'ui-monospace, monospace'
}}}%%
flowchart TD
    A["📁 Raw Sources<br/>git · tickets · docs"] --> B["🔍 OCR + Extract Text"]
    B --> C["✂️ Chunk by Semantic Unit"]
    C --> D["🧬 Embed + Index<br/>pgvector HNSW · BM25"]
    D --> E["🔗 Code Linking<br/>deterministic pass → semantic pass"]
    E --> F["🎯 Hybrid Retrieval<br/>vector + keyword · RRF · graph-neighbor expansion"]
    F --> G{"🚧 Evidence Gate<br/>enough proof to answer?"}
    G -- "no" --> H["🛑 Honest Refusal<br/>“I don't have this”<br/>no generation call made"]
    G -- "yes" --> I["✍️ Generate + Verify<br/>every sentence checked against its citation"]
    I --> J["✅ Answer + Receipts<br/>code line · ticket · video clip"]

    classDef source fill:#1a1410,stroke:#9a8f82,color:#f0ebe3
    classDef process fill:#1e1a15,stroke:#d4954a,color:#f0ebe3
    classDef gate fill:#2d6a4f,stroke:#4a9b72,color:#f0ebe3
    classDef refuse fill:#3d2a1f,stroke:#c9a07a,color:#f0ebe3
    classDef done fill:#2d6a4f,stroke:#4a9b72,color:#f0ebe3

    class A source
    class B,C,D,E,F process
    class G gate
    class H refuse
    class J done
```

There's a gate **before** generation — do we even have enough evidence to attempt this — and a gate **after** — does every sentence the model wrote actually trace back to a real citation. Both have to pass, every time, with no override.

<br />

---

## 🧪 Run it locally

**You'll need:** Node 20+, pnpm, Python 3.12, [`uv`](https://docs.astral.sh/uv/), Docker, and a [Clerk](https://clerk.com) account with Organizations enabled.

```bash
git clone git@github.com:MQ-06/backstory-ai.git && cd backstory-ai
cp .env.example apps/api/.env && cp .env.example apps/web/.env.local
make install && make up && make db-migrate && make dev
```

Second terminal — needed for file uploads and transcription:

```bash
make dev-worker
```

**To load the demo:** sign in → **Settings** → copy your org id, then:

```bash
export DEMO_CLERK_ORG_ID=org_xxxxxxxx && make demo-seed
```

| | |
|---|---|
| Web app | `localhost:3000` |
| API | `localhost:8000` |

Open the **Streetlight Payroll Demo**, ask it something, click a citation. That's the whole pitch in about ten seconds.

<br />

---

## 📍 Inside the app

<table width="100%">
<tr>
<td align="center" width="25%"><strong>Ask</strong><br/><sub>cited answers, streamed</sub></td>
<td align="center" width="25%"><strong>Sources</strong><br/><sub>git · tickets · docs</sub></td>
<td align="center" width="25%"><strong>Interviews</strong><br/><sub>brief · studio · clips</sub></td>
<td align="center" width="25%"><strong>Library</strong><br/><sub>every artifact, browsable</sub></td>
</tr>
</table>

<br />

---

## 🗺 After the MVP

The MVP covers Features 1–10: ingestion, code linking, plain-language Q&A, honest refusal, cross-horizon search, Answer Receipts, video interviews, and the Archaeology Brief — the demo no competitor can replicate. What ships after that is where the product compounds.

| Wave | What ships | The idea |
|---|---|---|
| **Right after launch** | Guardian Mode, post-fix micro-interviews, verbal commit messages | The flywheel — knowledge capture stops needing anyone to remember to do it |
| **First pilot** | Completeness scoring, module handover briefs | Turns a pilot into something with a measurable deliverable |
| **First enterprise deal** | Knowledge Insurance Report, risk heatmap, self-hosted/air-gapped | What a CTO actually signs a check for |
| **V3** | Code Funeral Notices, the rest | Preserve the knowledge context even after the code itself is deleted |

<br />

---

## 🛡 The non-negotiables

Two rules in this product don't have a config flag:

1. **Every claim has a source, or the claim doesn't ship.** If the evidence gate doesn't clear, generation doesn't even run.
2. **"I don't have this" is always on the table, and it's never styled like a failure.** A gap in the memory is a prompt to fill the gap — not something to paper over with a confident guess.

One hallucination is enough to undo every correct answer that came before it. So refusal isn't the fallback path here. It's the foundation everything else stands on.

<br />

---

© Ownership

This is a private, closed-source project. © 2026 MQ-06. All rights reserved.

No license is granted to copy, modify, distribute, or use this code or its contents without prior written permission.

<br />
---

<div align="center">

**Not another chatbot bolted onto your repo.**
A memory layer for the systems nobody fully understands anymore — including the people who built them.

<br />

<a href="https://backstory-ai.vercel.app">
  <img src="https://img.shields.io/badge/Open_Backstory-→-f0ebe3?style=for-the-badge&labelColor=d4954a" alt="Open Backstory" />
</a>

<br /><br />

<sub>Code tells you what. Backstory remembers why.</sub>

</div>
