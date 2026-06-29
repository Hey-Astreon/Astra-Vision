import sys
from backend.services.hydra_router import HydraRouter

def test_router():
    print("Initializing Hydra Router...")
    router = HydraRouter()

    print("\n--- Testing Explain Code (Cerebras) ---")
    code = "function add(a, b) { return a + b; }"
    res = router.explain_code(code, "math.js")
    print("Result:", res)

    print("\n--- Testing Explain Error (Gemini) ---")
    error = "ReferenceError: x is not defined"
    res = router.explain_error(error, code)
    print("Result:", res)

    print("\n--- Testing Generate Flow (Gemini) ---")
    res = router.generate_flow(code)
    print("Result:", res)

    print("\n--- Testing PR Review (Nvidia Nemotron) ---")
    diff = """
    diff --git a/math.js b/math.js
    index 0000000..1111111
    --- a/math.js
    +++ b/math.js
    @@ -1,3 +1,3 @@
     function add(a, b) {
    -  return a + b;
    +  return a + b; // no changes
     }
    """
    res = router.review_pr(diff)
    print("Result:", res)

if __name__ == "__main__":
    test_router()
