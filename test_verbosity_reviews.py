"""
test_verbosity_reviews.py — Verifies PR review dynamic prompt filtering (Option 4).
"""
import sys
sys.path.insert(0, 'backend')
from backend.services.hydra_router import HydraRouter

router = HydraRouter()

# A diff containing a minor styling nit (camelCase violation / docstring warning)
# and a critical vulnerability (direct SQL query concatenation)
dummy_diff = """
diff --git a/src/auth.js b/src/auth.js
index e69de29..cf81d45 100644
--- a/src/auth.js
+++ b/src/auth.js
@@ -1,7 +1,11 @@
+function get_user_data(userId) {
+    // Missing docstring warning (Style)
+    // Direct SQL injection (Critical)
+    const query = "SELECT * FROM users WHERE id = " + userId;
+    return db.execute(query);
+}
"""

print("=== Pass 1: Run PR Audit with verbosity=1 (Focus/Security Only) ===")
res1 = router.review_pr(dummy_diff, verbosity=1)
print("Comments count:", len(res1.get("comments", [])))
for comment in res1.get("comments", []):
    print(f"[{comment['severity']}] Line {comment['line']}: {comment['text']}")

print("\n=== Pass 2: Run PR Audit with verbosity=3 (Strict/Verbose/Style) ===")
res3 = router.review_pr(dummy_diff, verbosity=3)
print("Comments count:", len(res3.get("comments", [])))
for comment in res3.get("comments", []):
    print(f"[{comment['severity']}] Line {comment['line']}: {comment['text']}")
