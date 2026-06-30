import os
import subprocess
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class SelfHealEngine:
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            self.gemini_configured = True
        else:
            self.gemini_configured = False

    def _wrap_js_sandbox(self, code: str) -> str:
        """
        Injects browser DOM mocks and overrides Node's global require function
        to block dangerous host-level system modules.
        """
        wrapper = """
// ── Browser DOM / Globals Mocking ──
if (typeof global !== 'undefined') {
    global.window = global.window || {};
    global.document = global.document || {
        createElement: () => ({ style: {}, appendChild: () => {}, setAttribute: () => {} }),
        getElementById: () => null,
        querySelector: () => null
    };
    
    // Force override localStorage/sessionStorage to guarantee mock implementation works
    global.localStorage = {
        _data: {},
        getItem: function(k) { return this._data[k] || null; },
        setItem: function(k, v) { this._data[k] = String(v); },
        removeItem: function(k) { delete this._data[k]; },
        clear: function() { this._data = {}; }
    };
    global.sessionStorage = global.localStorage;
    global.navigator = global.navigator || { userAgent: "node" };
    global.location = global.location || { href: "", pathname: "/" };
}

// ── Sandbox Module Restrictions ──
if (typeof require !== 'undefined') {
    const blockedModules = ['fs', 'child_process', 'cluster', 'net', 'dgram', 'dns', 'http', 'https', 'tls'];
    const originalRequire = require;
    global.require = function(modName) {
        if (blockedModules.includes(modName)) {
            throw new Error("Security Violation: Module '" + modName + "' is blocked in this sandbox.");
        }
        return originalRequire(modName);
    };
}
"""
        return wrapper + "\n" + code

    def _wrap_py_sandbox(self, code: str) -> str:
        """
        Overrides python's builtins and import hook searchers to raise exceptions
        if LLM-generated code attempts file I/O or system execution.
        """
        wrapper = """
# ── Sandbox Import Restrictions ──
import builtins
import sys

blocked_modules = ['os', 'subprocess', 'socket', 'urllib', 'requests', 'shutil', 'ftplib']

# Clear from cache first in case they are pre-loaded
for mod in blocked_modules:
    if mod in sys.modules:
        del sys.modules[mod]

original_import = builtins.__import__

def restricted_import(name, globals=None, locals=None, fromlist=(), level=0):
    if any(name.startswith(blocked) for blocked in blocked_modules):
        raise ImportError(f"Security Violation: Module '{name}' is blocked in this sandbox.")
    return original_import(name, globals, locals, fromlist, level)

builtins.__import__ = restricted_import

# ── Sandbox File/Execution Restrictions ──
def restricted_open(*args, **kwargs):
    raise PermissionError("Security Violation: File I/O operations ('open') are blocked in this sandbox.")

builtins.open = restricted_open
"""
        return wrapper + "\n" + code

    def run_code(self, code: str, language: str, timeout: int = 5) -> dict:
        """
        Executes code string in a sandboxed subprocess and checks for assertion results.
        Returns a dictionary with success state, output, and execution logs.
        """
        is_js = language.lower() in ["javascript", "js"]
        
        # Apply safety and global environment wrappers
        wrapped_code = self._wrap_js_sandbox(code) if is_js else self._wrap_py_sandbox(code)
        
        try:
            if is_js:
                # Execute in Node.js
                result = subprocess.run(
                    ["node", "-e", wrapped_code],
                    timeout=timeout,
                    capture_output=True,
                    text=True
                )
            else:
                # Execute in Python
                result = subprocess.run(
                    ["python", "-c", wrapped_code],
                    timeout=timeout,
                    capture_output=True,
                    text=True
                )
                
            stdout = result.stdout
            stderr = result.stderr
            
            # Look for special pass/fail tokens in stdout/stderr
            passed = "__TEST_PASSED__" in stdout and "__TEST_FAILED__" not in stdout and "__TEST_FAILED__" not in stderr
            
            # If standard run fails or returns non-zero without tokens, count as failed
            if result.returncode != 0 and not passed:
                passed = False

            return {
                "success": True,
                "passed": passed,
                "stdout": stdout,
                "stderr": stderr,
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "passed": False,
                "stdout": "",
                "stderr": "Execution timed out (5 seconds limit exceeded)",
                "returncode": -1
            }
        except Exception as e:
            return {
                "success": False,
                "passed": False,
                "stdout": "",
                "stderr": f"Subprocess invocation failed: {str(e)}",
                "returncode": -2
            }

    def generate_test(self, code: str, audit_comment: str, language: str) -> str:
        """
        Uses gemini-2.5-flash to generate a failing unit test asserting the bug.
        """
        if not self.gemini_configured:
            raise ValueError("GEMINI_API_KEY is not configured.")

        is_js = language.lower() in ["javascript", "js"]
        format_instructions = ""
        
        if is_js:
            format_instructions = """
            Provide a complete, self-contained JavaScript script.
            Include the original function/code first.
            Below the function, add test execution block enclosed in a try-catch:
            try {
                // write assertions that will FAIL on the buggy original code
                console.assert(condition, "error message");
                
                // If it successfully reaches the end without exceptions, print the pass token
                console.log("__TEST_PASSED__");
            } catch (err) {
                console.log("__TEST_FAILED__: " + err.message);
                console.error("__TEST_FAILED__: " + err.message);
            }
            """
        else:
            format_instructions = """
            Provide a complete, self-contained Python script.
            Include the original function/code first.
            Below the function, add test execution block:
            try {
                # write assertions that will FAIL on the buggy original code
                assert condition, "error message"
                
                # If it successfully reaches the end without exceptions, print the pass token
                print("__TEST_PASSED__")
            } except AssertionError as err:
                print("__TEST_FAILED__:", str(err))
            except Exception as err:
                print("__TEST_FAILED__:", str(err))
            """

        prompt = f"""
        You are a quality assurance agent. Write a self-contained unit test that reproduces and proves the following code bug:
        Original Code:
        ```
        {code}
        ```
        Audit Warning / Bug details:
        "{audit_comment}"

        Language: {language}

        Instructions:
        {format_instructions}

        IMPORTANT:
        - The test assertions MUST fail when run against the original code.
        - Return ONLY the executable code block. Do NOT wrap the output in markdown block codes (like ```javascript or ```python). Do not add any text before or after the code block.
        """

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        
        # Clean up output code
        text = response.text.replace("```javascript", "").replace("```python", "").replace("```", "").strip()
        return text

    def generate_fix(self, code: str, audit_comment: str, test_code: str, language: str) -> str:
        """
        Uses gemini-2.5-pro to generate the healed fix for the code snippet.
        """
        if not self.gemini_configured:
            raise ValueError("GEMINI_API_KEY is not configured.")

        prompt = f"""
        You are an elite software developer. Fix the following code to resolve the specified bug.
        
        Original Code snippet to fix:
        ```
        {code}
        ```
        Audit Warning details:
        "{audit_comment}"

        Your fix must pass the following unit test assertions:
        ```
        {test_code}
        ```

        Language: {language}

        Instructions:
        - Modify the original code to fix the issue.
        - Return ONLY the clean, fixed code snippet (excluding the test assertions block).
        - Do NOT wrap in markdown block codes (like ```javascript). Do not explain or add commentary. Return pure executable code.
        """

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        
        text = response.text.replace("```javascript", "").replace("```python", "").replace("```", "").strip()
        return text

    def heal(self, code: str, audit_comment: str, language: str) -> dict:
        """
        Runs the full 4-step self-healing sequence.
        """
        # Step 1: Generate test assertions code
        test_code = self.generate_test(code, audit_comment, language)
        
        # Step 2: Execute unit test against original code (expect fail)
        fail_result = self.run_code(test_code, language)
        
        # Step 3: Generate code fix
        fixed_code = self.generate_fix(code, audit_comment, test_code, language)
        
        # Step 4: Execute test against fixed code (expect pass)
        # We need to assemble the test script but replacing the original code block with the fixed code block.
        # To make it simple, we ask Gemini to assemble the final pass test script using the fix.
        pass_test_code = test_code.replace(code.strip(), fixed_code.strip())
        
        # If replace didn't work directly due to formatting spacing, we reconstruct the passage test
        is_js = language.lower() in ["javascript", "js"]
        if fixed_code.strip() not in pass_test_code:
            # Let's rebuild the execution block
            assertion_part = test_code.split(code.strip())[-1] if code.strip() in test_code else test_code
            pass_test_code = f"{fixed_code}\n{assertion_part}"

        pass_result = self.run_code(pass_test_code, language)

        return {
            "test_code": test_code,
            "fail_result": fail_result,
            "fixed_code": fixed_code,
            "pass_test_code": pass_test_code,
            "pass_result": pass_result
        }
