# Astra Vision – AI Dev Brain & Interactive Code Reviewer

## Overview
Astra Vision is an advanced developer tool and AI code reviewer designed to help developers explore codebases, understand execution logic interactively, and catch deep semantic bugs. While competitors like **CodeRabbit** and **Greptile** focus purely on static reviews or high-level code graph indexing, Astra Vision introduces the first **Interactive Simulation Sandbox**—allowing developers to inspect code, tweak parameters, and run micro-simulations directly inside their review workflow.

---

## Competitor Analysis (2026 Landscape)

| Competitor | Core Strength | Astra Vision Advantage / Strategy |
| :--- | :--- | :--- |
| **CodeRabbit** | High speed, 40+ deterministic linters, low false-positive rate. | Astra Vision adds **Interactive Sandbox Simulations** to let developers play with the code, rather than just reading static comments. |
| **Greptile** | Full codebase indexing, 82% bug catch rate via agentic multi-hop tracing. | Astra Vision uses a hybrid semantic search + local cache to offer deep context without the extreme pricing and multi-minute latency of Greptile. |
| **PR-Agent (Qodo)** | Open-source flexibility, easy self-hosting. | Astra Vision will provide self-hostable Docker templates for startups to keep data private at no extra cost. |

---

## Tech Stack & Architecture (Hydra Protocol)
Astra Vision leverages the **Hydra Protocol**—a multi-model routing engine designed for speed, context depth, and cost efficiency:
* **Cerebras AI API**: High tokens-per-second model (e.g. Llama-3-70B on Cerebras) used for low-latency interactive line simulation and instant feedback.
* **Google AI Studio (Gemini 1.5)**: Deep context window (up to 2M tokens) used for mapping file relationships, generating flowcharts, and full repository codebase summaries.
* **Nvidia NIM (build.nvidia.com)**: Specialized optimization models used for code security audits and performance tuning.

---

## Tech Stack
- **Frontend**: React 18 + Tailwind CSS + Monaco Editor
- **Backend**: FastAPI (Python) + Hydra Routing Layer (OpenAI client, google-generativeai client)
- **Database (Roadmap)**: ChromaDB (for codebase semantic indexing)
- **Icons**: Phosphor Icons
- **Diagrams**: Mermaid.js

---

## Core Requirements & Roadmap

### P0: Visual Code Explainer (Implemented)
1. **GitHub Repository Input**: Paste a public repo URL to retrieve the codebase structure.
2. **File Explorer**: Collapsible tree viewer.
3. **Monaco Code Viewer**: VS Code-inspired syntax highlighting.
4. **Code Explanation**: Structured overview, key concepts, and summaries.
5. **Error Debugging**: Context-aware explanation of runtime errors.
6. **Mermaid Flow Diagram**: Automatic flow rendering.
7. **Line-by-Line Sandbox**: Interactive param simulation on isolated code lines.

### P1: Professional Code Review Engine (In Progress)
1. **Hydra Router Implementation**: Build a Python router that maps developer requests to the optimal endpoint (Cerebras, Gemini, or Nvidia).
2. **Pull Request Review API**: `/api/review-pull-request` endpoint to analyze diffs and produce structured review comments.
3. **Bug Severity Categorization**: Group AI comments by severity (Critical, Warning, Optimization, Style).
4. **Import Bug Fix**: Resolve the missing `analyzeError` import in the React frontend.

### P2: Repo-Scale Context (Future)
1. **Vector Indexing (ChromaDB)**: Index repository code chunks as semantic embeddings to resolve cross-file dependencies.
2. **GitHub OAuth**: Secure integration for private repository reviews.
3. **Dynamic Verbosity Slider**: Allow users to filter out noisy reviews and focus only on critical bugs.

---

## API Design

| Endpoint | Method | Input Payload | Output Payload |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | None | `{"status": "healthy"}` |
| `/api/explain-code` | POST | `{"code": "str", "filename": "str"}` | `{"success": true, "data": {"overview": "str", "key_parts": "str", "summary": "str"}}` |
| `/api/explain-error` | POST | `{"error": "str", "code": "str"}` | `{"success": true, "data": {"meaning": "str", "cause": "str", "fix": "str"}}` |
| `/api/generate-flow` | POST | `{"code": "str"}` | `{"success": true, "data": {"diagram": "str"}}` |
| `/api/review-pr` | POST | `{"diff": "str"}` | `{"success": true, "data": {"comments": [{"line": 10, "text": "str", "severity": "str"}]}}` |
