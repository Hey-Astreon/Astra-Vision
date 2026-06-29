import os
import re
from openai import OpenAI
import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv
from services.ast_parser import ASTParser

load_dotenv()

class CodeIndexer:
    def __init__(self):
        self.nvidia_key = os.getenv("NVIDIA_API_KEY")
        self.db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db")
        
        # Initialize chromadb client (persistent local directory)
        self.chroma_client = chromadb.PersistentClient(path=self.db_path)
        
        # Get or create the collection for code snippets
        self.collection = self.chroma_client.get_or_create_collection(
            name="astra_vision_codebase"
        )
        
        if self.nvidia_key:
            self.nvidia_client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=self.nvidia_key
            )
        else:
            self.nvidia_client = None
            
        # Initialize AST Parser
        self.ast_parser = ASTParser()

    def get_embedding(self, text: str, is_query: bool = False) -> list:
        """
        Generates embedding using Nvidia's nv-embedcode-7b model.
        is_query=True sets input_type to 'query', otherwise 'passage' for database storage.
        """
        if not self.nvidia_client:
            raise ValueError("NVIDIA_API_KEY is not configured.")
        
        input_type = "query" if is_query else "passage"
        
        response = self.nvidia_client.embeddings.create(
            input=[text],
            model="nvidia/nv-embedcode-7b-v1",
            extra_body={"input_type": input_type}
        )
        return response.data[0].embedding

    def chunk_file(self, filename: str, content: str) -> list:
        """
        Splits source code into logical chunks using AST parser or line-based fallbacks.
        """
        # Extract imports from file
        file_imports = self.ast_parser.extract_imports(filename, content)
        imports_str = ",".join([imp["imported_from"] for imp in file_imports])

        # Extract function/class definitions
        ast_chunks = self.ast_parser.extract_functions(filename, content)
        
        chunks = []
        for chunk in ast_chunks:
            # Build clean metadata matching requirements
            metadata = {
                "filename": filename,
                "start_line": chunk["start_line"],
                "end_line": chunk["end_line"],
                "type": chunk["type"], # 'function' | 'class' | 'generic_chunk'
                "name": chunk["name"] or "",
                "calls": ",".join(chunk.get("calls", [])),
                "imports": imports_str
            }
            chunks.append({
                "text": chunk["text"],
                "metadata": metadata
            })
            
        return chunks

    def index_repository(self, files: dict) -> dict:
        """
        Clears the database collection and indexes the new repo files.
        files input: { "src/app.js": "file content here", ... }
        """
        # Clear existing elements
        self.chroma_client.delete_collection("astra_vision_codebase")
        self.collection = self.chroma_client.get_or_create_collection(
            name="astra_vision_codebase"
        )
        
        all_chunks = []
        for filepath, content in files.items():
            if not content.strip():
                continue
            all_chunks.extend(self.chunk_file(filepath, content))
            
        if not all_chunks:
            return {"success": True, "indexed_chunks": 0}

        # Index in ChromaDB
        ids = []
        embeddings = []
        documents = []
        metadatas = []
        
        for idx, chunk in enumerate(all_chunks):
            chunk_id = f"chunk_{idx}_{chunk['metadata']['filename']}"
            ids.append(chunk_id)
            documents.append(chunk["text"])
            metadatas.append(chunk["metadata"])
            
            # Generate embedding
            if self.nvidia_client:
                try:
                    embeddings.append(self.get_embedding(chunk["text"], is_query=False))
                except Exception as e:
                    print(f"Failed to generate embedding for {chunk_id}: {e}")
                    # Fallback empty embedding (we will omit adding this chunk if embedding fails)
                    continue
            
        if embeddings:
            self.collection.add(
                ids=ids[:len(embeddings)],
                embeddings=embeddings,
                documents=documents[:len(embeddings)],
                metadatas=metadatas[:len(embeddings)]
            )
            
        return {"success": True, "indexed_chunks": len(embeddings)}

    def search_context(self, query: str, limit: int = 3) -> list:
        """
        Searches the codebase for chunks related to a semantic query or error message.
        """
        if not self.nvidia_client or self.collection.count() == 0:
            return []
            
        try:
            query_embedding = self.get_embedding(query, is_query=True)
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=limit
            )
            
            context_results = []
            if results and results["documents"]:
                for idx in range(len(results["documents"][0])):
                    context_results.append({
                        "text": results["documents"][0][idx],
                        "metadata": results["metadatas"][0][idx]
                    })
            return context_results
        except Exception as e:
            print(f"Error querying semantic code context: {e}")
            return []
