import os, sys
sys.path.insert(0, 'backend')
from backend.services.code_indexer import CodeIndexer

indexer = CodeIndexer()

files = {
    "src/utils.js": """
    export function helper(user) {
        console.log("Helping " + user);
    }
    """,
    "src/app.js": """
    import { helper } from './utils';
    
    function startApp() {
        helper("Alice");
    }
    """
}

# Index the files
print("=== Indexing repository ===")
result = indexer.index_repository(files)
print("Indexed chunks count:", result)

# Now, retrieve the document for startApp to see if dependencies are correctly stored
print("\n=== Searching function in ChromaDB ===")
db_results = indexer.collection.get(
    where={"name": "startApp"}
)
print("ChromaDB get result:")
for key in ["ids", "metadatas", "documents"]:
    print(f"{key}: {db_results[key]}")

# Test context retrieval for starting app
print("\n=== Resolving context for startApp ===")
from backend.services.hydra_router import HydraRouter
router = HydraRouter()
context = router.explain_code('function startApp() {\n    helper("Alice");\n}', 'src/app.js')
print("Resolved explanation response keys:", context.keys())
if "dependencies" in context:
    print("Resolved dependencies list:", context["dependencies"])
