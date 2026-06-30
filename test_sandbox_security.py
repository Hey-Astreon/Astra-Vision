"""
test_sandbox_security.py — Verifies mock context and safety sandbox features of Option 2.
"""
import sys
sys.path.insert(0, 'backend')
from backend.services.self_heal_engine import SelfHealEngine

engine = SelfHealEngine()

# ── Test 1: JS Browser DOM Mocks ──
js_dom_code = """
window.myVar = "active";
document.createElement("div");
localStorage.setItem("key", "value");
console.assert(localStorage.getItem("key") === "value", "localStorage set/get failed");
console.log("__TEST_PASSED__");
"""

print("=== Test 1: Run JS code referencing browser globals (window, document, localStorage) ===")
res1 = engine.run_code(js_dom_code, "javascript")
print("Success:", res1["success"])
print("Passed:", res1["passed"])
print("Stderr (Errors):", res1["stderr"].strip())

# ── Test 2: JS Block List Security Verification ──
js_vuln_code = """
try {
    const fs = require('fs');
    console.log("FS module successfully loaded! (FAIL)");
} catch (e) {
    console.log("Expected violation intercepted:", e.message);
    console.log("__TEST_PASSED__");
}
"""

print("\n=== Test 2: Run JS code trying to require('fs') ===")
res2 = engine.run_code(js_vuln_code, "javascript")
print("Success:", res2["success"])
print("Passed:", res2["passed"])
print("Stdout (Logs):", res2["stdout"].strip())

# ── Test 3: Python Block List Security Verification ──
py_vuln_code = """
try:
    import os
    print("OS module loaded! (FAIL)")
except ImportError as e:
    print("Expected import violation intercepted:", str(e))
    print("__TEST_PASSED__")
"""

print("\n=== Test 3: Run Python code trying to import 'os' ===")
res3 = engine.run_code(py_vuln_code, "python")
print("Success:", res3["success"])
print("Passed:", res3["passed"])
print("Stdout (Logs):", res3["stdout"].strip())

# ── Test 4: Python File I/O Block List Verification ──
py_file_code = """
try:
    open("test.txt", "w")
    print("File open succeeded! (FAIL)")
except PermissionError as e:
    print("Expected open violation intercepted:", str(e))
    print("__TEST_PASSED__")
"""

print("\n=== Test 4: Run Python code trying to call open() ===")
res4 = engine.run_code(py_file_code, "python")
print("Success:", res4["success"])
print("Passed:", res4["passed"])
print("Stdout (Logs):", res4["stdout"].strip())
