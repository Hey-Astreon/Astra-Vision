"""
ast_parser.py — Deterministic AST parsing engine using tree-sitter.

Extracts structured metadata from JS and Python source files:
  - Function/class definitions (with exact line ranges)
  - Import statements (cross-file dependency edges)
  - Function call sites (intra-function dependency edges)
"""

import re
from typing import Optional

try:
    import tree_sitter_javascript as tsjava
    import tree_sitter_python as tspython
    from tree_sitter import Language, Parser
    TREE_SITTER_AVAILABLE = True
except ImportError:
    TREE_SITTER_AVAILABLE = False


class ASTParser:
    def __init__(self):
        if TREE_SITTER_AVAILABLE:
            self.js_language = Language(tsjava.language())
            self.py_language = Language(tspython.language())
            self.js_parser = Parser(self.js_language)
            self.py_parser = Parser(self.py_language)
        
    def _detect_language(self, filename: str) -> Optional[str]:
        """Return canonical language string from filename extension."""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext in ("js", "jsx", "ts", "tsx", "mjs"):
            return "javascript"
        if ext == "py":
            return "python"
        return None

    def _get_parser(self, language: str):
        if language == "javascript":
            return self.js_parser
        if language == "python":
            return self.py_parser
        return None

    def _get_node_text(self, node, source_bytes: bytes) -> str:
        return source_bytes[node.start_byte:node.end_byte].decode("utf-8", errors="replace")

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    def extract_functions(self, filename: str, content: str) -> list:
        """
        Returns a list of function/class chunks with exact AST line boundaries.
        Each item: { text, name, type, start_line, end_line, calls, filename }
        Falls back to regex chunking if tree-sitter is unavailable.
        """
        language = self._detect_language(filename)

        if TREE_SITTER_AVAILABLE and language in ("javascript", "python"):
            return self._ast_extract_functions(filename, content, language)
        
        return self._regex_fallback_chunks(filename, content)

    def extract_imports(self, filename: str, content: str) -> list:
        """
        Returns a list of imported module names/paths from the file.
        Used to build the cross-file dependency graph.
        Each item: { source_file, imported_from, import_name }
        """
        language = self._detect_language(filename)
        if TREE_SITTER_AVAILABLE and language == "javascript":
            return self._js_extract_imports(filename, content)
        if TREE_SITTER_AVAILABLE and language == "python":
            return self._py_extract_imports(filename, content)
        return self._regex_extract_imports(filename, content)

    def extract_calls(self, content: str) -> list:
        """
        Returns a list of function call names found in the given code snippet.
        Used by the Hydra Router to resolve context for called functions.
        """
        # Use a simple universal regex for call extraction — works across languages.
        pattern = re.compile(r'\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(')
        # Exclude common language keywords that look like function calls
        SKIP = {
            "if", "for", "while", "switch", "catch", "return", "typeof",
            "instanceof", "new", "delete", "await", "yield", "import",
            "print", "super", "assert", "raise", "pass", "class", "def",
        }
        calls = [m.group(1) for m in pattern.finditer(content) if m.group(1) not in SKIP]
        return list(dict.fromkeys(calls))  # dedup, preserve order

    # ──────────────────────────────────────────────────────────────────────────
    # AST Extraction Helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _ast_extract_functions(self, filename: str, content: str, language: str) -> list:
        parser = self._get_parser(language)
        source_bytes = content.encode("utf-8")
        tree = parser.parse(source_bytes)
        root = tree.root_node

        results = []
        FUNC_TYPES = {
            "javascript": {
                "function_declaration", "function_expression",
                "arrow_function", "method_definition",
                "generator_function_declaration"
            },
            "python": {
                "function_definition", "async_function_definition",
                "decorated_definition"
            }
        }

        CLASS_TYPES = {
            "javascript": {"class_declaration", "class_expression"},
            "python": {"class_definition"},
        }

        def walk(node):
            node_type = node.type
            target_types = FUNC_TYPES.get(language, set()) | CLASS_TYPES.get(language, set())

            if node_type in target_types:
                text = self._get_node_text(node, source_bytes)
                start_line = node.start_point[0] + 1
                end_line = node.end_point[0] + 1

                # Try to resolve the function/class name
                name = self._resolve_name(node, source_bytes, language)
                chunk_type = "class" if node_type in CLASS_TYPES.get(language, set()) else "function"

                # Extract internal calls
                calls = self.extract_calls(text)

                results.append({
                    "text": text,
                    "name": name,
                    "type": chunk_type,
                    "start_line": start_line,
                    "end_line": end_line,
                    "calls": calls,
                    "filename": filename,
                })
                # Don't recurse into nested functions — they're captured by their parent text
                return

            for child in node.children:
                walk(child)

        walk(root)

        # If nothing was extracted, fall back to generic chunking
        if not results:
            return self._regex_fallback_chunks(filename, content)

        return results

    def _resolve_name(self, node, source_bytes: bytes, language: str) -> str:
        """Walk node children looking for the identifier name."""
        # Check standard name child (function_declaration, class_declaration)
        name_child = node.child_by_field_name("name")
        if name_child:
            return self._get_node_text(name_child, source_bytes)

        # Arrow/anon functions: look at parent variable declarator
        if node.parent and node.parent.type in ("variable_declarator", "assignment"):
            name_child = node.parent.child_by_field_name("name")
            if name_child:
                return self._get_node_text(name_child, source_bytes)

        return "<anonymous>"

    def _js_extract_imports(self, filename: str, content: str) -> list:
        parser = self.js_parser
        source_bytes = content.encode("utf-8")
        tree = parser.parse(source_bytes)

        imports = []
        IMPORT_TYPES = {
            "import_statement", "import_declaration",
            "call_expression"  # require() calls
        }

        def walk(node):
            if node.type in ("import_statement", "import_declaration"):
                # Find the source (the string literal)
                for child in node.children:
                    if child.type == "string":
                        source = self._get_node_text(child, source_bytes).strip("'\"` ")
                        imports.append({
                            "source_file": filename,
                            "imported_from": source
                        })

            # Detect: const x = require('./utils')
            elif node.type == "call_expression":
                func_child = node.child_by_field_name("function")
                if func_child and self._get_node_text(func_child, source_bytes) == "require":
                    args = node.child_by_field_name("arguments")
                    if args:
                        for child in args.children:
                            if child.type == "string":
                                source = self._get_node_text(child, source_bytes).strip("'\"` ")
                                imports.append({
                                    "source_file": filename,
                                    "imported_from": source
                                })

            for child in node.children:
                walk(child)

        walk(tree.root_node)
        return imports

    def _py_extract_imports(self, filename: str, content: str) -> list:
        parser = self.py_parser
        source_bytes = content.encode("utf-8")
        tree = parser.parse(source_bytes)

        imports = []

        def walk(node):
            if node.type == "import_from_statement":
                module_node = node.child_by_field_name("module_name")
                if module_node:
                    imports.append({
                        "source_file": filename,
                        "imported_from": self._get_node_text(module_node, source_bytes)
                    })
            elif node.type == "import_statement":
                for child in node.children:
                    if child.type == "dotted_name":
                        imports.append({
                            "source_file": filename,
                            "imported_from": self._get_node_text(child, source_bytes)
                        })

            for child in node.children:
                walk(child)

        walk(tree.root_node)
        return imports

    # ──────────────────────────────────────────────────────────────────────────
    # Fallbacks (used when tree-sitter is not available or file has no functions)
    # ──────────────────────────────────────────────────────────────────────────

    def _regex_fallback_chunks(self, filename: str, content: str) -> list:
        """Regex-based chunking, preserved from the original CodeIndexer."""
        chunks = []
        lines = content.splitlines()
        func_regex = re.compile(
            r"(function\s+(\w+)|const\s+(\w+)\s*=\s*\(.*?\)\s*=>|def\s+(\w+))"
        )
        matches = list(func_regex.finditer(content))

        if matches:
            for idx, match in enumerate(matches):
                start_char = match.start()
                end_char = matches[idx + 1].start() if idx + 1 < len(matches) else len(content)
                chunk_text = content[start_char:end_char].strip()
                start_line = content[:start_char].count("\n") + 1
                end_line = start_line + chunk_text.count("\n")
                # Get first capturing group that has a value
                name = next((g for g in match.groups()[1:] if g), "<anonymous>")
                calls = self.extract_calls(chunk_text)
                chunks.append({
                    "text": chunk_text,
                    "name": name,
                    "type": "function",
                    "start_line": start_line,
                    "end_line": end_line,
                    "calls": calls,
                    "filename": filename,
                })
        else:
            # Generic 30-line chunks
            chunk_size, overlap = 30, 5
            for i in range(0, len(lines), chunk_size - overlap):
                chunk_lines = lines[i:i + chunk_size]
                if not chunk_lines:
                    break
                chunk_text = "\n".join(chunk_lines)
                calls = self.extract_calls(chunk_text)
                chunks.append({
                    "text": chunk_text,
                    "name": None,
                    "type": "generic_chunk",
                    "start_line": i + 1,
                    "end_line": min(i + chunk_size, len(lines)),
                    "calls": calls,
                    "filename": filename,
                })

        return chunks

    def _regex_extract_imports(self, filename: str, content: str) -> list:
        """Simple regex import extraction for unsupported languages."""
        imports = []
        # Match: import X from 'Y' / require('Y') / from X import Y
        patterns = [
            re.compile(r"import\s+.*?\s+from\s+['\"](.+?)['\"]"),
            re.compile(r"require\s*\(\s*['\"](.+?)['\"]\s*\)"),
            re.compile(r"from\s+(\S+)\s+import"),
        ]
        for pattern in patterns:
            for match in pattern.finditer(content):
                imports.append({
                    "source_file": filename,
                    "imported_from": match.group(1)
                })
        return imports
