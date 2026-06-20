<div align="center">

<img src=".github/assets/readme-banner.svg" alt="Backstory — memory layer for legacy systems" width="920" />

<br />

<a href="https://backstory-ai.vercel.app">
  <img src="https://img.shields.io/badge/→_Try_it_live-backstory--ai.vercel.app-d4954a?style=for-the-badge&labelColor=1a1410&color=f0ebe3" alt="Try it live" />
</a>

<br /><br />

<img src=".github/assets/readme-hero.png" alt="Backstory Ask screen with Answer Receipt citations" width="920" />

</div>

<br />

<table width="100%"><tr><td bgcolor="#1a1410" style="padding:28px 32px;border-radius:14px;">

<p align="center" style="color:#9a8f82;font-size:12px;letter-spacing:0.14em;margin:0 0 12px 0;">THE IDEA</p>

<p align="center" style="color:#f0ebe3;font-size:17px;line-height:1.6;margin:0;max-width:720px;">
Legacy systems don’t fail because the code is missing.<br/>
They fail because the <strong style="color:#d4954a;">why</strong> was never written down.
</p>

<p align="center" style="color:#9a8f82;font-size:15px;line-height:1.65;margin:18px 0 0 0;">
Git · tickets · docs · expert interviews — one memory layer.<br/>
Ask in plain English. Every answer ships with <strong style="color:#4a9b72;">receipts you can click</strong>.<br/>
No evidence? <strong style="color:#c9a07a;">“I don’t have this.”</strong> Always.
</p>

</td></tr></table>

<br />

<p align="center" style="color:#9a8f82;font-size:13px;margin:0;">
<em>Not another chatbot on your repo.</em>
</p>

<br />

---

<div align="center">

<p style="color:#d4954a;font-size:11px;letter-spacing:0.16em;font-weight:700;margin:0 0 16px 0;">HOW IT WORKS</p>

<img src=".github/assets/readme-flow.svg" alt="Connect → Ask → Answer Receipt or honest refusal" width="920" />

</div>

<br />

<table width="100%"><tr><td bgcolor="#1e1a15" style="padding:22px 28px;border-radius:12px;border:1px solid #3d3630;">

<p style="color:#f0ebe3;margin:0 0 8px 0;font-size:15px;">
<strong style="color:#d4954a;">Archaeology Brief</strong> — before an expert leaves, Backstory reads the system’s risk signals and generates questions only they can answer. Record the interview. The next answer gets stronger.
</p>
<p style="color:#4a9b72;margin:0;font-family:ui-monospace,monospace;font-size:13px;">
payroll_calc.py:142 · JIRA-4821 · Interview @ 04:12
</p>

</td></tr></table>

<br />

---

<div align="center">

<p style="color:#d4954a;font-size:11px;letter-spacing:0.16em;font-weight:700;margin:0 0 16px 0;">UNDER THE HOOD</p>

<img src=".github/assets/readme-stack.svg" alt="Architecture — Next.js, FastAPI, Postgres, Redis, Groq" width="920" />

<br /><br />

<p align="center" style="margin:0;">
<img src="https://img.shields.io/badge/Next.js-15-1a1410?style=flat-square&logo=nextdotjs&logoColor=d4954a" alt="Next.js" />
<img src="https://img.shields.io/badge/FastAPI-Python-d4954a?style=flat-square&logo=fastapi&logoColor=1a1410" alt="FastAPI" />
<img src="https://img.shields.io/badge/Postgres-pgvector-2d6a4f?style=flat-square&logo=postgresql&logoColor=f0ebe3" alt="Postgres" />
<img src="https://img.shields.io/badge/Redis-Celery-c8853a?style=flat-square&logo=redis&logoColor=1a1410" alt="Redis" />
<img src="https://img.shields.io/badge/Clerk-Auth-2a2520?style=flat-square&logo=clerk&logoColor=f0ebe3" alt="Clerk" />
<img src="https://img.shields.io/badge/Groq-LLM_+_Whisper-1e1a15?style=flat-square&logo=smartthings&logoColor=d4954a" alt="Groq" />
</p>

</div>

<br />

---

<table width="100%"><tr><td bgcolor="#12100d" style="padding:28px 32px;border-radius:14px;border-top:3px solid #d4954a;">

<p align="center" style="color:#d4954a;font-size:11px;letter-spacing:0.16em;font-weight:700;margin:0 0 20px 0;">RUN IT LOCALLY</p>

<p style="color:#9a8f82;margin:0 0 16px 0;font-size:14px;">
Node 20+ · pnpm · Python 3.12 · <a href="https://docs.astral.sh/uv/" style="color:#d4954a;">uv</a> · Docker · <a href="https://clerk.com" style="color:#d4954a;">Clerk</a> with Organizations
</p>

<pre style="background:#0c0a08;color:#f0ebe3;padding:16px 20px;border-radius:10px;border:1px solid #3d3630;overflow-x:auto;font-size:13px;line-height:1.5;"><code>git clone git@github.com:MQ-06/backstory-ai.git && cd backstory-ai
cp .env.example apps/api/.env && cp .env.example apps/web/.env.local
make install && make up && make db-migrate && make dev</code></pre>

<p style="color:#9a8f82;margin:16px 0 8px 0;font-size:13px;">Second terminal · uploads &amp; transcription:</p>

<pre style="background:#0c0a08;color:#d4954a;padding:12px 20px;border-radius:10px;border:1px solid #3d3630;font-size:13px;margin:0;"><code>make dev-worker</code></pre>

<p style="color:#9a8f82;margin:16px 0 8px 0;font-size:13px;">Demo · sign in → <strong style="color:#f0ebe3;">Settings</strong> → copy org id:</p>

<pre style="background:#0c0a08;color:#f0ebe3;padding:12px 20px;border-radius:10px;border:1px solid #3d3630;font-size:13px;margin:0;"><code>export DEMO_CLERK_ORG_ID=org_xxxxxxxx && make demo-seed</code></pre>

<p style="color:#f0ebe3;margin:16px 0 0 0;font-size:14px;">
App → <code style="color:#4a9b72;background:#0c0a08;padding:2px 6px;border-radius:4px;">localhost:3000</code> &nbsp;·&nbsp; API → <code style="color:#4a9b72;background:#0c0a08;padding:2px 6px;border-radius:4px;">localhost:8000</code><br/>
Open <strong>Streetlight Payroll Demo</strong> · ask · click a citation.
</p>

</td></tr></table>

<br />

---

<div align="center">

<p style="color:#d4954a;font-size:11px;letter-spacing:0.16em;font-weight:700;margin:0 0 20px 0;">IN THE APP</p>

<table>
<tr>
<td align="center" width="22%" style="padding:16px;"><strong style="color:#f0ebe3;">Ask</strong><br/><span style="color:#9a8f82;font-size:12px;">cited answers</span></td>
<td align="center" width="22%" style="padding:16px;"><strong style="color:#f0ebe3;">Sources</strong><br/><span style="color:#9a8f82;font-size:12px;">git · issues · docs</span></td>
<td align="center" width="22%" style="padding:16px;"><strong style="color:#d4954a;">Capture</strong><br/><span style="color:#9a8f82;font-size:12px;">brief · interviews</span></td>
<td align="center" width="22%" style="padding:16px;"><strong style="color:#f0ebe3;">Library</strong><br/><span style="color:#9a8f82;font-size:12px;">every artifact</span></td>
</tr>
</table>

<br />

<a href="https://backstory-ai.vercel.app">
  <img src="https://img.shields.io/badge/Open_Backstory-→-f0ebe3?style=for-the-badge&labelColor=d4954a" alt="Open Backstory" />
</a>

<br /><br />

<sub style="color:#9a8f82;">Memory layer for legacy systems</sub>

</div>
