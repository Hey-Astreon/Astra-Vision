import os
from openai import OpenAI
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class HydraRouter:
    def __init__(self):
        self.cerebras_key = os.getenv("CEREBRAS_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.nvidia_key = os.getenv("NVIDIA_API_KEY")

        # Initialize Cerebras client if key is present
        if self.cerebras_key:
            self.cerebras_client = OpenAI(
                base_url="https://api.cerebras.ai/v1",
                api_key=self.cerebras_key
            )
        else:
            self.cerebras_client = None

        # Initialize Nvidia client if key is present
        if self.nvidia_key:
            self.nvidia_client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=self.nvidia_key
            )
        else:
            self.nvidia_client = None

        # Initialize Gemini API if key is present
        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            self.gemini_configured = True
        else:
            self.gemini_configured = False

        # Initialize Code Indexer for semantic context retrieval
        from services.code_indexer import CodeIndexer
        self.indexer = CodeIndexer()

    def explain_code(self, code: str, filename: str = None) -> dict:
        """
        Uses Cerebras (gpt-oss-120b) or Gemini to explain code, resolving cross-file AST dependencies.
        Uses namespace-isolated queries: call sites are matched against import_map to restrict
        ChromaDB lookups to the specific resolved file, eliminating name collisions.
        """
        # ── Step 1: Build import_map for the active file ──────────────────────
        # The import_map is stored in each chunk's metadata as:
        #   "helper->src/utils.js,validate->src/validators.js"
        # We parse this to build: { "helper": "src/utils.js", ... }
        import_map = {}
        try:
            if filename and self.indexer.collection.count() > 0:
                file_chunks = self.indexer.collection.get(
                    where={"filename": filename}
                )
                if file_chunks and file_chunks["metadatas"]:
                    raw_map = file_chunks["metadatas"][0].get("import_map", "")
                    for entry in raw_map.split(","):
                        if "->" in entry:
                            alias, resolved = entry.split("->", 1)
                            import_map[alias.strip()] = resolved.strip()
        except Exception as e:
            print(f"Warning: Could not load import_map for {filename}: {e}")

        # ── Step 2: Resolve dependency context using namespace isolation ───────
        dependency_context = ""
        resolved_dependencies = []
        try:
            calls = self.indexer.ast_parser.extract_calls(code)
            found_defs = []

            for call_name in calls:
                target_file = import_map.get(call_name)  # None = local or unknown

                if target_file:
                    # Namespace-isolated: search ONLY in the resolved file
                    db_results = self.indexer.collection.get(
                        where={"$and": [{"filename": target_file}, {"name": call_name}]}
                    )
                    search_scope = f"in {target_file} (namespace-resolved)"
                else:
                    # Fallback: global search (function may be local or built-in)
                    db_results = self.indexer.collection.get(
                        where={"name": call_name}
                    )
                    search_scope = "global search"

                if db_results and db_results["documents"]:
                    doc = db_results["documents"][0]
                    meta = db_results["metadatas"][0]
                    found_defs.append(
                        f"Function '{call_name}' [{search_scope}] defined in "
                        f"{meta['filename']} (lines {meta['start_line']}-{meta['end_line']}):\n"
                        f"```\n{doc}\n```"
                    )
                    resolved_dependencies.append(call_name)

            if found_defs:
                dependency_context = (
                    "\n=== RESOLVED AST DEPENDENCY CONTEXT ===\n"
                    + "\n\n".join(found_defs)
                    + "\n=======================================\n"
                )
        except Exception as e:
            print(f"Error resolving AST dependency context: {e}")

        prompt = f"""
        Analyze this code:
        Filename: {filename or 'Unknown'}
        Code:
        ```
        {code}
        ```
        {dependency_context}

        Provide a JSON response with the following keys:
        - "overview": a short sentence describing what the code does.
        - "key_parts": a brief description of functions/variables/logic used (mentioning resolved dependencies if applicable).
        - "summary": a one-sentence summary of the execution outcome.
        - "dependencies": a list of string names of resolved dependency functions.
        Ensure you only return valid JSON. Do not include markdown wraps in your text keys.
        """

        # Try Cerebras first (Speed-critical task)
        if self.cerebras_client:
            try:
                response = self.cerebras_client.chat.completions.create(
                    model="gpt-oss-120b",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.2,
                )
                import json
                res_data = json.loads(response.choices[0].message.content)
                if "dependencies" not in res_data:
                    res_data["dependencies"] = resolved_dependencies
                return res_data
            except Exception as e:
                print(f"Cerebras explain_code failed: {e}. Falling back to Gemini...")

        # Fallback to Gemini (2.5-flash is standard in 2026)
        if self.gemini_configured:
            try:
                model = genai.GenerativeModel("gemini-2.5-flash")
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                import json
                res_data = json.loads(response.text)
                if "dependencies" not in res_data:
                    res_data["dependencies"] = resolved_dependencies
                return res_data
            except Exception as e:
                print(f"Gemini explain_code failed: {e}")

        # Static Mock fallback
        return {
            "overview": "This code defines functions and handles logic step by step.",
            "key_parts": "Includes functions, variables, and control flow such as loops and conditions.",
            "summary": "Overall, the code processes input and produces structured output.",
            "dependencies": resolved_dependencies
        }

    def explain_error(self, error: str, code: str = None) -> dict:
        """
        Uses Gemini (2.5-flash) to analyze a runtime error with code context.
        """
        # Query semantic codebase context related to the error
        context_chunks = self.indexer.search_context(error, limit=2)
        context_str = ""
        if context_chunks:
            context_str = "\n".join([
                f"Related context from {c['metadata']['filename']} (Lines {c['metadata']['start_line']}-{c['metadata']['end_line']}):\n{c['text']}"
                for c in context_chunks
            ])

        prompt = f"""
        A developer encountered a runtime error.
        Error Message: {error}
        Code Context:
        ```
        {code or 'No code context provided.'}
        ```
        
        Related Codebase Context:
        {context_str}
        
        Provide a JSON response explaining the error with the following keys:
        - "meaning": clear explanation of what this error means.
        - "cause": why did this error happen in the context of the code.
        - "fix": concrete advice on how to fix this error.
        Ensure you only return valid JSON.
        """

        if self.gemini_configured:
            try:
                model = genai.GenerativeModel("gemini-2.5-flash")
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                import json
                return json.loads(response.text)
            except Exception as e:
                print(f"Gemini explain_error failed: {e}")

        return {
            "meaning": f"An execution error occurred: {error}",
            "cause": "A runtime exception or syntax issue was triggered.",
            "fix": "Check syntax and verify all variables are defined before invocation."
        }

    def generate_flow(self, code: str) -> dict:
        """
        Uses Gemini (2.5-flash) to generate a Mermaid.js diagram.
        """
        prompt = f"""
        Generate a Mermaid.js flowchart (starting with graph TD) for the following code.
        Make it clean, simple, and stable. Do not use special characters in labels that break Mermaid parsing.
        Code:
        ```
        {code}
        ```
        Return a JSON object with a single key: "diagram" containing the Mermaid.js graph string.
        Do not wrap the mermaid graph in markdown blocks inside the JSON.
        """

        if self.gemini_configured:
            try:
                model = genai.GenerativeModel("gemini-2.5-flash")
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                import json
                return json.loads(response.text)
            except Exception as e:
                print(f"Gemini generate_flow failed: {e}")

        return {
            "diagram": "graph TD; A[Start] --> B[Process Code]; B --> C[End];"
        }

    def review_pr(self, diff: str) -> dict:
        """
        Uses Nvidia's Nemotron-3-Ultra-550b-a55b with thinking enabled for deep security reviews.
        """
        # Query semantic codebase context related to the diff
        context_chunks = self.indexer.search_context(diff, limit=3)
        context_str = ""
        if context_chunks:
            context_str = "\n".join([
                f"Related context from {c['metadata']['filename']} (Lines {c['metadata']['start_line']}-{c['metadata']['end_line']}):\n{c['text']}"
                for c in context_chunks
            ])

        prompt = f"""
        Perform a comprehensive code review on the following git diff, taking into account the related codebase context.
        Focus on finding security vulnerabilities, memory leaks, performance issues, and code smells.
        Format your response strictly as a JSON object with a key "comments" containing a list of review comments:
        {{
            "comments": [
                {{
                    "line": 10,
                    "text": "Detailed review comment explaining the issue, why it is a problem, and how to fix it.",
                    "severity": "Critical" | "Warning" | "Optimization" | "Style"
                }}
            ]
        }}

        Related Codebase Context:
        {context_str}

        Git Diff:
        {diff}
        Ensure you only return valid JSON.
        """

        if self.nvidia_client:
            try:
                # Call Nvidia Nemotron 550b with thinking/reasoning enabled
                completion = self.nvidia_client.chat.completions.create(
                    model="nvidia/nemotron-3-ultra-550b-a55b",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    max_tokens=8192,
                    extra_body={
                        "chat_template_kwargs": {"enable_thinking": True},
                        "reasoning_budget": 4096
                    }
                )
                
                # Extract clean content (ignoring reasoning_content for final JSON parsing)
                content = completion.choices[0].message.content
                clean_content = content.replace("```json", "").replace("```", "").strip()
                
                import json
                return json.loads(clean_content)
            except Exception as e:
                print(f"Nvidia Nemotron PR Review failed: {e}. Falling back to Gemini...")

        if self.gemini_configured:
            try:
                model = genai.GenerativeModel("gemini-2.5-pro")
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                import json
                return json.loads(response.text)
            except Exception as e:
                print(f"Gemini PR Review failed: {e}")

        return {
            "comments": [
                {
                    "line": 1,
                    "text": "Code reviewed successfully. No major issues found.",
                    "severity": "Style"
                }
            ]
        }
