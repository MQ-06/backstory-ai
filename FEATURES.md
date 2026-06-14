# Backstory — Feature Specification

> **The memory layer for legacy systems. Code tells you what — Backstory remembers why.**

Backstory captures the knowledge that was never written down — from decades of tickets and commits, from AI-led interviews with departing engineers, and from every fix as it happens — links it to the exact code it describes, and answers questions with verifiable proof.

This document is the complete v1 feature specification: the required foundation, the four signature features, the five extended features, and the build order.

---

## How to read this document

Every feature exists to do one of three jobs:

| Job | Meaning |
|---|---|
| **Capture** | Pull a "why" out of a person's head or a system's history |
| **Protect** | Stop someone from breaking something the memory knows is dangerous |
| **Deliver** | Surface the right "why" at the exact moment it's needed |

Any proposed feature that does none of the three is scope creep and gets rejected.

---

## Part 1 · The Foundation

*Eight required features. None are impressive alone — together they are the machine everything else runs on.*

### 1. Git ingestion — `Capture`
Pulls code, commit history, blame data, pull requests, and issues from GitHub/GitLab.

> **Example:** Backstory learns that `payroll_calc.py` was changed 47 times, mostly by one person, with a burst of emergency fixes every December.

### 2. Ticket import — `Capture`
Imports every ticket and its resolution from Jira, Linear, or GitHub Issues.

> **Example:** Ticket #4821 — "Payroll job crashes on month-end" — and its fix become part of the memory, permanently linked to the code they touched.

### 3. Document upload — `Capture`
Ingests runbooks, PDFs, Word documents, and Confluence/Notion exports.

> **Example:** The 2014 "Month-End Procedures" doc nobody can find on the shared drive becomes searchable and linked to the jobs it describes.

### 4. Code linking — `Capture`
Every ticket, document, and interview statement is automatically pinned to the files and functions it describes. **This is the hardest engineering in the foundation — and what makes everything else possible.**

> **Example:** Ticket #4821 is auto-linked to `calculate_net()` lines 122–140. Anyone looking at either one finds the other.

### 5. Video interviews with timestamped transcripts — `Capture`
Experts are recorded on camera; every sentence is time-coded. Video, not just audio — the answer clips are the product's magic.

### 6. Plain-language Q&A — `Deliver`
One chat box. Ask anything in normal English (or Urdu).

> **Example:** "Why does the payroll job fail on months with 31 days?"

### 7. Honest refusal — `Deliver`
If the memory does not contain the answer, Backstory says **"I don't have this"** instead of guessing. One confident hallucination destroys all trust. This rule is absolute and non-configurable.

### 8. Cross-horizon search — `Deliver`
One question searches code, tickets, documents, and interviews **simultaneously** and combines them into a single answer.

> **Example:** One answer cites a 2019 ticket, a line of code, and a clip from an interview recorded last March — together.

---

## Part 2 · The Extraordinary Four

*The reasons Backstory wins. These are the features no competitor has.*

### 9. Answer Receipts — `Deliver`
Every answer arrives with clickable proof: the exact code line, the ticket number, and the video clip opening at the precise second the engineer explains it. **No source, no claim — ever.**

> **Use case:** Sara, new on the team, hits a 2 a.m. crash. She asks Backstory and gets: *"This is a known month-end issue. Root cause: a 2011 banking API workaround. Sources: [`payroll_calc.py:134`] [ticket #4821] [▶ Ahmed's interview, 14:32]."* She clicks the video — Ahmed is mid-sentence explaining exactly this bug. Crisis solved in 20 minutes instead of 3 days.

### 10. The Archaeology Brief — `Capture` · **Signature feature**
Before interviewing an expert, Backstory studies their system — most-patched files, 3 a.m. fixes, single-owner modules, ticket density spikes — and generates questions only that expert can answer.

> **Use case:** Ahmed retires in 90 days. Backstory's prep dossier reads: *"Module `RECON-7`: patched 14 times between 2009–2014, twice by Ahmed at night; ticket density spikes every quarter-end; no one else has touched it since. Question 1: walk me through the night of the March 2012 incident."* Ahmed's reaction: "How does it know about that?"

### 11. Guardian Mode — `Protect`
When a developer opens a PR touching a file with captured warnings, Backstory comments on the PR automatically — with the warning, the source, and the clip.

> **Use case:** A new dev tries to "clean up" a weird-looking date check. Within seconds a bot comment appears: *"⚠ Ahmed flagged this code: never remove — it prevents double-payment of pensioners (1996 incident). [▶ 2-min clip] [ticket #1107]."* The mistake never happens.

### 12. Post-Fix Micro-Interview — `Capture`
The moment an incident closes, Backstory asks the dev three voice questions: *What was the real cause? What didn't work? What should the next person know?* Ninety seconds, pinned to the diff and ticket forever.

> **Use case:** Sara fixes the crash at 3 a.m. Before closing the ticket, Backstory asks its three questions; she talks for 90 seconds and goes to bed. Two years later her successor finds that clip attached to the same module — the flywheel turning.

---

## Part 3 · The Five Gems

*Extended features from the strategic analysis. All confirmed for the roadmap.*

### 13. Verbal commit messages — `Capture` · **Build early**
Record a 30-second voice note when pushing a commit; transcribed and linked to the diff. The cheapest habit-former in the product — the micro-interview generalized from incidents to all meaningful changes.

> **Use case:** A dev pushes a change and speaks: *"Changed this because the load balancer drops connections above 10k concurrent — NOT because the algorithm was wrong. Don't revert it."* Three years later, that one sentence saves someone a week.

### 14. Interview completeness score — `Capture`
After each session, Backstory compares what has been asked against the system's risk map: *"68% of Ahmed's critical knowledge captured — 8 topics remain. Here they are."*

> **Use case:** The customer contract literally specifies "90% capture before retirement date." The progress bar makes knowledge capture a completable, billable deliverable instead of a vague hope. Sales loves the number as much as engineers do.

### 15. Knowledge handshake protocol — `Capture`
When a module changes hands, Backstory generates a structured handover brief: *what I know, what I'm unsure of, what scared me, what you must never do.*

> **Use case:** Bilal moves to another team. His 15-minute recorded handoff for the billing module includes: *"I never understood why the retry count is 7 — Ahmed set it. Ask the memory before changing it."* The hallway conversation that never happens, formalized.

### 16. Code funeral notices — `Deliver` · **v3**
When code is deleted or deprecated, its full knowledge context is preserved: what it did, why it existed, why it was removed.

> **Use case:** In 2028, a vendor file format from 2016 mysteriously reappears. The module that handled it was deleted in 2025 — but its funeral notice survives, with the parsing logic, the lore, and the original author's clip. Resurrection takes a day instead of a month.

### 17. Knowledge insurance report — `Deliver`
A quarterly PDF for the CTO: coverage trend, single points of failure, highest-risk modules, and the sentence that gets budgets approved: *"If these 2 people left tomorrow, here is what would be unrecoverable."*

> **Use case:** The CTO forwards the report to the board as evidence of operational-risk management. Backstory stops being a dev-tool line item and becomes a governance expense — a different, bigger budget.

---

## Part 4 · Build order

| Wave | Features | Why this order |
|---|---|---|
| **Launch** (weeks 1–6) | Foundation (1–8) + Answer Receipts (9) + Archaeology Brief (10) | The demo no competitor can replicate |
| **Right after launch** | Guardian Mode (11) + Micro-Interview (12) + Verbal commits (13) | The habit and the flywheel — what makes month-6 retention exist |
| **First pilot** | Completeness score (14) + Handshake protocol (15) + staleness flags | Turns pilots into contracts with measurable deliverables |
| **First enterprise deal** | Insurance report (17) + knowledge-risk heatmap + self-hosted deployment | What CTOs and banks pay for |
| **v3** | Funeral notices (16) + everything else | Earned by customer demand |

---

## Deliberately excluded from v1

| Feature | Reason |
|---|---|
| First-person "ghost persona" of departed experts | Uncanny-valley and consent risk; scoped third-person retrieval ("what did Ahmed say about X") gives 100% of the utility with 0% of the legal exposure |
| Automated business-rule extraction | Direct collision with Swimm's core product — a fight we lose; capture from humans instead (our lane) |
| Horizontal expansion (sales/legal/ops knowledge) | Dilutes the wedge; revisit at v4 after the legacy-systems beachhead is won |
| Live meeting capture | Consent and works-council risk; late v2 at the earliest, opt-in per meeting, extraction-only |
| Slack/Teams bots, SSO, dashboards, analytics | Enterprise table stakes for later; zero launch value |

---

## The one-line test, restated

> **Does it capture a why, protect a why, or deliver a why at the moment it's needed?**
> If none of the three — it doesn't get built.
