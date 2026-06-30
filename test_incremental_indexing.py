"""
test_incremental_indexing.py — Verifies the delta-updates and cost-saving limits of Option 3.
"""
import sys
sys.path.insert(0, 'backend')
from backend.services.code_indexer import CodeIndexer

indexer = CodeIndexer()

# Mock workspace files
files_v1 = {
    "src/math.js": """
    function add(a, b) {
        return a + b;
    }
    """,
    "src/utils.js": """
    function greet(name) {
        return "Hello " + name;
    }
    """
}

print("=== Pass 1: Initial Repository Index ===")
res1 = indexer.index_repository(files_v1)
print("Result:", res1)
print("Stored DB elements count:", indexer.collection.count())

print("\n=== Pass 2: Re-indexing with ZERO modifications (Should skip all embedding requests) ===")
res2 = indexer.index_repository(files_v1)
print("Result:", res2)
print("Stored DB elements count:", indexer.collection.count())

# Modify only math.js
files_v2 = {
    "src/math.js": """
    function add(a, b) {
        // Updated comment to trigger hash change
        return a + b;
    }
    """,
    "src/utils.js": """
    function greet(name) {
        return "Hello " + name;
    }
    """
}

print("\n=== Pass 3: Re-indexing with ONE modification in math.js (Should only index math.js, skipping utils.js) ===")
res3 = indexer.index_repository(files_v2)
print("Result:", res3)
print("Stored DB elements count:", indexer.collection.count())

# Delete utils.js from files payload
files_v3 = {
    "src/math.js": """
    function add(a, b) {
        // Updated comment to trigger hash change
        return a + b;
    }
    """
}

print("\n=== Pass 4: Re-indexing after DELETING utils.js (Should surgically delete utils.js chunks) ===")
res4 = indexer.index_repository(files_v3)
print("Result:", res4)
print("Stored DB elements count:", indexer.collection.count())
