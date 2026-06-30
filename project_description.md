# ASTRA VISION: The Proactive Self-Healing IDE Companion
*Submission Document for Vibe2Ship Hackathon (Coding Ninjas x Google for Developers)*

---

## 1. Selected Problem Statement
*   **Problem Statement 1**: The Last-Minute Life Saver
*   **Target Audience**: Developers, CS Students, Entrepreneurs, and Tech Builders racing against product release and code submission deadlines.
*   **Core Concept**: Moving beyond passive reminders to take proactive, autonomous action to save developer deadlines from compilation crashes, failed tests, and security flaws.

---

## 2. Solution Overview
Every software developer, student, and startup founder has faced the dread of a breaking compilation error, dependency conflict, or runtime bug right before a critical submission or product launch deadline. Traditional static code analysis tools (like SonarQube or ESLint) act as passive reminders—they flag nits and issues but leave the developer to spend hours debugging, writing tests, and figuring out fixes manually.

Astra Vision is a proactive, agentic development companion that moves beyond passive warnings to take meaningful, automated action:
1.  **Monaco Diagnostics Overlay**: Integrates compiler markers directly into a modern VS Code-like React IDE dashboard.
2.  **Autonomous Sandbox Healing**: Spawns a secure test runner sandbox, generates test scripts asserting the bug, designs code fixes, executes automated validations, and applies the healed code directly into the workspace.
3.  **Cross-File AST Dependency Graphing**: Uses `tree-sitter` compilers to parse workspace import structures and trace dependencies deterministically. It passes the code graph to the LLM to understand nested imports without manual copy-pasting.

---

## 3. High-Scoring Technical Capabilities Matrix

| Technical Capability | Astra Vision | Competitor Tools (e.g. CodeRabbit, SonarQube) | Standard LLMs (e.g. ChatGPT) |
| :--- | :---: | :---: | :---: |
| **Deterministic Code Graphing** | **Yes (AST via `tree-sitter`)** | Partial (Heuristic/Files) | No |
| **Secure Verification Sandboxing** | **Yes (Node.js & Python Exec)** | No | No |
| **Recursive Context Resolution** | **Yes (Graph Dependency Walk)** | No | No |
| **Inline Editor Diagnostics** | **Yes (Monaco markers)** | No (PR Comments only) | No |
| **Autonomous Self-Healing** | **Yes (Generate → Fail → Heal → Pass)** | No | No |
| **Multi-Provider Fallbacks** | **Yes (Hydra Protocol Routing)** | No | No |
| **Hashed Delta Skips** | **Yes (MD5 Checksums)** | No | No |

---

## 4. System Architecture
*Copy this code, paste it into [mermaid.live](https://mermaid.live), download the image, and insert it below!*

```mermaid
graph TD
    %% Styling
    classDef gcp fill:#4285F4,stroke:#333,stroke-width:1px,color:#fff;
    classDef tool fill:#8E24AA,stroke:#333,stroke-width:1px,color:#fff;
    classDef db fill:#F4511E,stroke:#333,stroke-width:1px,color:#fff;
    classDef model fill:#00ACC1,stroke:#333,stroke-width:1px,color:#fff;

    A[Monaco Code Editor] -->|1. Run Audit / Explain| B(Hydra Router Services)
    B -->|2. Query Context| C[(ChromaDB Vector Store)]::db
    
    B -->|3. Compile AST & Imports| D(Tree-Sitter Compiler Engine)::tool
    D -->|4. Resolve Local Paths| E[Hashed Delta Checks & MD5 Signatures]
    E -->|Update Changed Only| C
    
    A -->|5. Trigger Self-Heal| F(Self-Healing Sandbox Engine)
    F -->|6. Wrap Safe Code & Inject DOM Mocks| G[Subprocess Sandbox Exec]
    G -->|7. Run Tests & Catch Exceptions| H[Node.js / Python Runtime]
    H -->|8. Apply Verified Fix| A

    B -->|Cerebras gpt-oss-120b| I[Speed Layer: sub-second explanations]::model
    B -->|Nvidia NIM Nemotron 550b| J[Reasoning Layer: deep security reviews]::model
    F -->|Google Gemini 2.5| K[Generation Layer: test & fix code]::model

    class B,F gcp;
```

---

## 5. Key Engineering Pillars

### 🧠 A. Hydra Protocol & Context Resolution
Astra Vision coordinates specialized LLM engines through the **Hydra Protocol** based on speed, reasoning capabilities, and token budgets:
*   **Speed Layer (Cerebras - gpt-oss-120b)**: Dispatches instant, sub-second responses for interactive code explanation and logic flows.
*   **Reasoning Layer (Nvidia NIM - nemotron-3-ultra-550b-a55b)**: Utilizes reasoning budget tokens to scan code changes (Git diffs) for deep-seated security flaws, race conditions, memory leaks, and architectural issues.
*   **Healing Layer (Google AI Studio - Gemini-2.5-Flash)**: Orchestrates recursive token generation to construct tests, execute sandbox runs, and emit structural code repairs.

### 🛡️ B. Secure Sandbox Isolation & DOM Environment Mocking
To execute LLM-generated code safely without putting the developer's host machine at risk, Astra Vision introduces strict sandbox boundaries:
*   **Browser DOM Mocks**: Prefixes JavaScript code with mock global structures (e.g. fake `window`, `document`, and custom mock implementations for `localStorage` and `sessionStorage`) so UI-reliant components run without reference errors.
*   **OS Security Intercepts**: Overrides Node's global `require()` to block dangerous host-level modules (`fs`, `child_process`, `net`, `http`, etc.) and overrides `builtins.open` and `__import__` in Python to block host file system access.

### ⚡ C. Hashed Incremental Indexing
Instead of re-embedding the entire repository on every change, Astra Vision computes MD5 checksum hashes of file contents:
*   **Differential Updates**: Compares workspace file hashes against signatures stored in ChromaDB metadata.
*   **Zero-Overhead Skips**: Files that have not been modified are skipped, reducing Nvidia NIM embedding requests by **over 95%** and preventing rate-limit blocks.
*   **Surgical Deletion**: Only modified or deleted files have their old vector chunks removed using targeted `filename` metadata deletions before writing updates.

---

## 6. Google Technologies Utilized
*   **Google Gemini API (Gemini 2.5 Flash / Pro)**: Drives the self-healing code repair models, generates mock test cases, and compiles Mermaid flow diagrams dynamically.
*   **Google Cloud Platform (GCP)**: Fully deployed on **Google Cloud Run** using containerized Docker build submissions, offering seamless global scalability.
*   **Google AI Studio**: Leveraged during development to iterate on prompts and test generation parameters.
