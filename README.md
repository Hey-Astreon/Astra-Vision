<div align="center">
  <img src="https://img.icons8.com/nolan/128/artificial-intelligence.png" alt="Astra Vision Logo" width="120" />
  
  # 🌌 Astra Vision
  ### *The Autonomous AI Code Review, Semantic Graphing & Self-Healing Sandbox Engine*

  [![React](https://img.shields.io/badge/Frontend-React-blue?style=for-the-badge&logo=react)](https://react.dev/)
  [![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Monaco Editor](https://img.shields.io/badge/Editor-Monaco-purple?style=for-the-badge&logo=visual-studio-code)](https://microsoft.github.io/monaco-editor/)
  [![ChromaDB](https://img.shields.io/badge/Database-ChromaDB-orange?style=for-the-badge&logo=semantic-web)](https://www.trychroma.com/)
  [![Tree-Sitter](https://img.shields.io/badge/AST-Tree--Sitter-red?style=for-the-badge)](https://tree-sitter.github.io/tree-sitter/)
  
  ---
  
  **Astra Vision** is a professional, repository-scale AI pair programming environment. It integrates deterministic Abstract Syntax Tree (AST) analysis, a persistent vector database, inline Monaco editor markers, and isolated code execution environments to deliver automated, verified codebase enhancements.
</div>

---

## 📖 Table of Contents
1. [Capabilities Matrix](#-capabilities-matrix-astra-vision-vs-competitors)
2. [Interface & Features Walkthrough (For Beginners)](#-interface--features-walkthrough-for-beginners)
    * [Step 1: Staging a Codebase](#step-1-staging-a-codebase)
    * [Step 2: Exploring Code & Line Simulation](#step-2-exploring-code--line-simulation)
    * [Step 3: Explaining Code & Resolving AST Graph Dependencies](#step-3-explaining-code--resolving-ast-graph-dependencies)
    * [Step 4: Running a PR Audit (AI Code Review)](#step-4-running-a-pr-audit-ai-code-review)
    * [Step 5: Executing the Autonomous Self-Healer](#step-5-executing-the-autonomous-self-healer)
    * [Step 6: Debugging Errors & Generating Flowcharts](#step-6-debugging-errors--generating-flowcharts)
3. [Key Innovation Pillars (Technical Deep Dive)](#-key-innovation-pillars-under-the-hood)
4. [Repository Directory Tree](#-repository-directory-tree)
5. [API Documentation](#-api-documentation)
6. [Setup & Execution](#-setup--execution)

---

## 🌟 Capabilities Matrix: Astra Vision vs. Competitors

| Feature | Astra Vision | CodeRabbit / Greptile | Standard LLM Tools |
| :--- | :---: | :---: | :---: |
| **Deterministic Code Graphing** | **Yes (AST via `tree-sitter`)** | Partial (Heuristic/Files) | No |
| **Verification Sandboxing** | **Yes (Node.js & Python Exec)** | No | No |
| **Recursive Context Resolution** | **Yes (Graph Dependency Walk)** | No | No |
| **Inline Editor Diagnostics** | **Yes (Monaco markers)** | No (PR Comments only) | No |
| **Autonomous Self-Healing** | **Yes (Generate → Fail → Heal → Pass)** | No | No |
| **Multi-Provider Fallbacks** | **Yes (Hydra Protocol Routing)** | No | No |

---

## 🖥️ Interface & Features Walkthrough (For Beginners)

This walkthrough explains how to use each pane in the Astra Vision web dashboard and what each component does under the hood.

---

### Step 1: Staging a Codebase
When you launch the dashboard at `http://localhost:3000`, the left sidebar is your codebase manager.

<div align="center">
  <img src="https://img.icons8.com/color/48/opened-folder.png" alt="File Explorer" width="30"/>
</div>

*   **Option A: Load the Demo (Recommended first step)**:
    1. Click the **"Try Demo Repository"** button in the sidebar.
    2. This populates the explorer with a pre-configured mockup repository containing `app.js` (a buggy server script), `utils.js` (helper functions), and a `package.json` package manifest.
    3. Look for the green **"Demo Mode Active"** and **"Codebase indexed"** status badges. This means the vector database has embedded your files.
*   **Option B: Connect a GitHub Repo**:
    1. Paste a public GitHub URL (e.g., `https://github.com/owner/repo`) in the text box.
    2. Click **"Fetch Repository"**.
    3. The application will fetch the source, index the functions using `tree-sitter` AST parsing, and show the file explorer tree.
*   **Action**: Click the `src/` directory to expand it, and click on `app.js` to open it in the editor.

---

### Step 2: Exploring Code & Line Simulation
Once a file is loaded, it displays inside the **Monaco Code Editor** (the exact editor engine powering VS Code).

<div align="center">
  <img src="https://img.icons8.com/color/48/source-code.png" alt="Monaco Editor" width="30"/>
</div>

*   **Syntax Highlighting**: Code elements (keywords, strings, functions) are colored according to your file type.
*   **Deep Line-by-Line Simulation**:
    1. Move your mouse into the editor and **click directly on any line of code** (for example, click the line `return "Hello " + name;` in `app.js`).
    2. In the right panel, look at the **"AI Analysis"** card.
    3. It extracts that exact line, its variable contexts, and displays interactive input forms.
    4. Type a value in the input boxes (e.g., set `name = "Astreon"`). The simulator automatically runs logic checks and outputs the reactive outcome (e.g., `"Hello Astreon"`) dynamically in the panel.

---

### Step 3: Explaining Code & Resolving AST Graph Dependencies
If you need to understand what a file does at a high structural level, use the **Code Explanation** pane.

<div align="center">
  <img src="https://img.icons8.com/color/48/mind-map.png" alt="AST Dependencies" width="30"/>
</div>

1. Ensure a file is open, then locate the **"Code Explanation"** section in the right sidebar.
2. Click the **"Explain"** button.
3. This sends the file context to the fast Cerebras API.
4. **What to look for in the output**:
    *   **Astra Overview**: A plain-English summary of the file's primary responsibility.
    *   **Logic Flow**: A step-by-step breakdown of how data flows through the file.
    *   **AST Dependencies Resolved**: If the open file calls functions defined in *other* files in your repository (for example, `app.js` calling a function inside `utils.js`), Astra Vision traverses the AST parser graph, retrieves their source definitions, and displays them as tags (e.g. `helper()`). These functions are automatically loaded into the LLM context to make explanations highly accurate.

---

### Step 4: Running a PR Audit (AI Code Review)
To find bugs, security concerns, or performance bottlenecks in your codebase, run a full review.

<div align="center">
  <img src="https://img.icons8.com/color/48/checked-user-male.png" alt="PR Review" width="30"/>
</div>

1. Locate the **"AI Code Review (PR Audit)"** section in the right sidebar.
2. Click the **"Run Audit"** button. This invokes the Nvidia Nemotron model, which uses reasoning budget tokens to scan your code.
3. **What to look for in the editor**:
    *   Look back at the **Monaco Code Editor**. You will see squiggly underlines under lines that contain issues (Red for critical vulnerabilities, Orange/Yellow for warnings).
    *   **Hover your mouse** over any squiggly line. A popup tooltip with the label `[Astra Vision]` will display a detailed explanation of the issue (e.g., *"String concatenation is a security risk... Use template literals instead"*).
4. **Filtering Results**:
    *   Use the **"Filter Severity"** dropdown in the audit panel to narrow down comments to only `Critical` or `Warning`.
    *   Click the **"Line #"** button on any review card in the sidebar. The editor will automatically scroll and highlight that line.

---

### Step 5: Executing the Autonomous Self-Healer
Astra Vision can fix the issues it flags and test them inside a sandboxed environment.

<div align="center">
  <img src="https://img.icons8.com/color/48/maintenance.png" alt="Self Healing" width="30"/>
</div>

1. Locate a warning comment card inside the PR Audit panel (e.g., the Warning on Line 2).
2. Click the **"⚡ Run & Heal"** button on that card.
3. **What to look for (Autonomous Sandbox Run)**:
    *   An animated step tracker appears showing progress:
        1. `🧪 Gen Test` — Generates a test that targets this specific bug.
        2. `❌ Run Fail` — Runs the test inside a Node.js/Python sandbox and confirms the test fails on the original buggy code.
        3. `🔧 Heal` — Tells Gemini to fix the code to resolve the test failure.
        4. `✅ Run Pass` — Re-runs the test against the fixed code and confirms it passes successfully.
4. **Reviewing and Applying the Patch**:
    *   Once execution is done, the card displays a **"TEST PASSED"** badge.
    *   A green box shows the proposed fixed code.
    *   If you like the changes, click the **"Apply Fix to Editor"** button.
    *   **The editor is updated in real-time** with the repaired code! The squiggly lines are automatically cleared to prepare for your next audit.

---

### Step 6: Debugging Errors & Generating Flowcharts
Astra Vision also includes utility tools at the bottom of the right panel.

<div align="center">
  <img src="https://img.icons8.com/color/48/combo-chart.png" alt="Flowcharts" width="30"/>
</div>

*   **Error Debugger**:
    1. Paste a raw error stack trace or compiler output (e.g. from your console terminal) into the text box.
    2. Click **"Explain Error"**.
    3. The backend cross-references the error text against the indexed codebase vectors in ChromaDB, finds the offending files, and outputs its **meaning**, **cause**, and the exact code modifications required to fix it.
*   **Flow Diagram**:
    1. Click the **"Generate"** button.
    2. Gemini parses the structural branches in the active file and builds a Mermaid.js graph.
    3. A clean, visual block chart renders in the sidebar showing the logical execution branches.

---

## 🚀 Key Innovation Pillars (Under the Hood)

### 🧠 1. Hydra Protocol & System Architecture
Astra Vision coordinates multiple specialized AI models, Abstract Syntax Tree compilers, and sandboxed runtimes through an orchestrated execution topology:

```mermaid
graph TD
    %% Styling
    classDef gcp fill:#4285F4,stroke:#333,stroke-width:1px,color:#fff;
    classDef tool fill:#8E24AA,stroke:#333,stroke-width:1px,color:#fff;
    classDef db fill:#F4511E,stroke:#333,stroke-width:1px,color:#fff;
    classDef model fill:#00ACC1,stroke:#333,stroke-width:1px,color:#fff;

    A[Monaco Code Editor] -->|1. Run Audit / Explain| B(Hydra Router Services)
    B -->|2. Query Context| C[(ChromaDB Vector Store)]::db
    
    %% Option 1 & 3 integration
    B -->|3. Compile AST & Imports| D(Tree-Sitter Compiler Engine)::tool
    D -->|4. Resolve Local Paths| E[Hashed Delta Checks & MD5 Signatures]
    E -->|Update Changed Only| C
    
    %% Option 2 Sandbox integration
    A -->|5. Trigger Self-Heal| F(Self-Healing Sandbox Engine)
    F -->|6. Wrap Safe Code & Inject DOM Mocks| G[Subprocess Sandbox Exec]
    G -->|7. Run Tests & Catch Exceptions| H[Node.js / Python Runtime]
    H -->|8. Apply Verified Fix| A

    %% Models
    B -->|Cerebras gpt-oss-120b| I[Speed Layer: sub-second explanations]::model
    B -->|Nvidia NIM Nemotron 550b| J[Reasoning Layer: deep security reviews]::model
    F -->|Google Gemini 2.5| K[Generation Layer: test & fix code]::model

    class B,F gcp;
```

---

### 🛡️ 2. AST Path Resolution & Namespace Isolation (Option 1)
To handle professional, multi-directory repositories without name collisions (e.g. multiple files defining a `validate()` function), Astra Vision implements:
*   **Path Resolvers**: Translates relative (`./utils`), parent (`../auth`), and index package imports (`/__init__.py`, `/index.js`) to absolute workspace identifiers.
*   **Namespace-Isolated Queries**: When analyzing function calls, the indexer queries ChromaDB utilizing strict `$and` filters:
    ```python
    db_results = collection.get(
        where={"$and": [{"filename": resolved_import_path}, {"name": call_name}]}
    )
    ```
    This completely eliminates namespace collisions across different files and modules.

---

### ⚡ 3. Hashed Incremental Indexing & Git Syncing (Option 3)
Instead of re-embedding the entire repository on every change, Astra Vision computes MD5 checksum hashes of file contents:
*   **Differential Updates**: Compares workspace file hashes against signatures stored in ChromaDB metadata.
*   **Zero-Overhead Skips**: Files that have not been modified are skipped, reducing Nvidia NIM embedding requests by **over 95%** and preventing rate-limit blocks.
*   **Surgical Deletion**: Only modified or deleted files have their old vector chunks removed using targeted `filename` metadata deletions before writing updates.

---

### 🔒 4. Secure Sandbox Isolation & DOM Environment Mocking (Option 2)
To execute LLM-generated code safely without putting the developer's host machine at risk, Astra Vision introduces strict sandbox boundaries:
1.  **Browser DOM Mocks**: Prefixes JavaScript code with mock global structures (e.g. fake `window`, `document`, and custom mock implementations for `localStorage` and `sessionStorage`) so UI-reliant components run without reference errors.
2.  **OS Security Intercepts**: Overrides Node's global `require()` to block dangerous host-level modules (`fs`, `child_process`, `net`, `http`, etc.):
    ```javascript
    global.require = function(modName) {
        if (['fs', 'child_process', 'net'].includes(modName)) {
            throw new Error("Security Violation: Module blocked.");
        }
        return originalRequire(modName);
    };
    ```
3.  **Python File I/O Lockouts**: Intercepts `builtins.open` to raise a `PermissionError` on file access and overrides `builtins.__import__` to block `os`, `subprocess`, and network socket modules.

---

### 🎨 5. Monaco Inline Diagnostics
Injects warnings directly into the editor viewport to avoid context-switching:
1.  **Severity Mapping**:
    *   `Critical` ➔ `monaco.MarkerSeverity.Error` (Red squiggly)
    *   `Warning` ➔ `monaco.MarkerSeverity.Warning` (Yellow/Orange squiggly)
    *   `Optimization` ➔ `monaco.MarkerSeverity.Info` (Blue squiggly)
    *   `Style` ➔ `monaco.MarkerSeverity.Hint` (Faded underline)
2.  **Coordinates Mapping**: Dynamically calculates character offsets and non-whitespace starts for each line to align underlines with code tokens.
3.  **Active Hover tooltips**: Hovering over underlined code segments displays a hover popup styled with the `[Astra Vision]` tag and issue details.

---

## 📂 Repository Directory Tree

```bash
├── backend/
│   ├── services/
│   │   ├── ast_parser.py           # tree-sitter JS/Python parser & call site extractor
│   │   ├── code_indexer.py         # ChromaDB semantic indexing manager
│   │   ├── hydra_router.py         # Multi-provider model router (Cerebras, NIM, Gemini)
│   │   └── self_heal_engine.py     # Subprocess sandbox code executor
│   ├── server.py                   # FastAPI routing server
│   └── requirements.txt            # Python dependencies (tree-sitter, chromadb)
│
├── frontend/
│   ├── src/
│   │   ├── utils/
│   │   │   └── analysisEngine.js   # Local simulation fallback helpers
│   │   ├── App.js                  # App layout, Monaco mounts & markers syncing
│   │   └── index.js                # React entry
│   └── package.json                # Frontend package manifest
│
├── test_ast_parser.py              # CLI test for AST parser imports & calls extraction
├── test_ast_indexing.py            # CLI test for ChromaDB metadata graph storage
└── test_self_heal.py               # CLI test for the self-healing sandbox pipeline
```

---

## 🔌 API Documentation

### 1. Repository Indexing
*   **Endpoint**: `POST /api/index-repo`
*   **Payload**:
    ```json
    {
      "files": {
        "src/app.js": "function start() { helper(); }",
        "src/utils.js": "export function helper() { console.log('work'); }"
      }
    }
    ```
*   **Response**:
    ```json
    {
      "success": true,
      "data": {
        "success": true,
        "indexed_chunks": 2
      }
    }
    ```

### 2. Autonomous Self-Healing
*   **Endpoint**: `POST /api/self-heal`
*   **Payload**:
    ```json
    {
      "code": "function greet(name) { return 'Hello ' + name; }",
      "audit_comment": "String concatenation is security risk. Use template literals instead.",
      "language": "javascript"
    }
    ```
*   **Response**:
    ```json
    {
      "success": true,
      "data": {
        "test_code": "function greet(name) { ... }; try { console.assert(...); console.log('__TEST_PASSED__'); } ...",
        "fail_result": { "success": true, "passed": false, "stdout": "__TEST_FAILED__", "stderr": "..." },
        "fixed_code": "function greet(name) {\n  return `Hello ${name}`;\n}",
        "pass_result": { "success": true, "passed": true, "stdout": "__TEST_PASSED__", "stderr": "" }
      }
    }
    ```

---

## 🛠️ Setup & Execution

### Environment Variables
Create a `.env` file in the `backend/` directory:
```env
CEREBRAS_API_KEY="your-key"
NVIDIA_API_KEY="nvapi-..."
GEMINI_API_KEY="AIzaSy..."
```

### Running Astra Vision
A shell script launcher is included at the workspace root to orchestrate execution:
```bash
# Executing standard Windows Launcher
./start_astra_vision.bat
```

To run manually:
```bash
# Terminal 1: Python API Server
cd backend
python server.py

# Terminal 2: React Web Frontend
cd frontend
npm install
npm start
```

---

## 🔬 CLI Diagnostic Suites
Run these scripts to inspect engine operations directly in your command line:

```bash
# Run tree-sitter AST extraction
python test_ast_parser.py

# Run ChromaDB graph metadata search
python test_ast_indexing.py

# Run self-healing test assertions lifecycle
python test_self_heal.py
```
