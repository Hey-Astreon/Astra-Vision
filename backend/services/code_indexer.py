import os
import re
import hashlib
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

    def chunk_file(self, filename: str, content: str, indexed_files: set = None) -> list:
        """
        Splits source code into logical chunks using AST parser or line-based fallbacks.
        Stores a resolved import_map in metadata for namespace-aware dependency queries.
        """
        # Extract imports with resolved paths
        file_imports = self.ast_parser.extract_imports(filename, content, indexed_files)
        
        # Build import_map: "alias->resolved_path" entries for all named imports
        # e.g. "helper->src/utils.js,validate->src/validators.js"
        import_map_parts = []
        for imp in file_imports:
            resolved = imp.get("resolved_path", imp["imported_from"])
            aliases = imp.get("aliases", [])
            if aliases:
                for alias in aliases:
                    import_map_parts.append(f"{alias}->{resolved}")
            else:
                # Namespace import: entire module aliased
                import_map_parts.append(f"{imp['imported_from']}->{resolved}")
        import_map_str = ",".join(import_map_parts)

        # Extract function/class definitions
        ast_chunks = self.ast_parser.extract_functions(filename, content)
        
        chunks = []
        for chunk in ast_chunks:
            metadata = {
                "filename": filename,
                "start_line": chunk["start_line"],
                "end_line": chunk["end_line"],
                "type": chunk["type"],
                "name": chunk["name"] or "",
                "calls": ",".join(chunk.get("calls", [])),
                "import_map": import_map_str,
            }
            chunks.append({
                "text": chunk["text"],
                "metadata": metadata
            })
            
        return chunks

    def index_repository(self, files: dict) -> dict:
        """
        Performs incremental/differential updates of the database collection.
        Surgically deletes only added/modified/deleted files, preserving the rest of the database index.
        """
        # Get existing chunks and build a map of: { filename: current_file_hash }
        existing_file_hashes = {}
        try:
            existing = self.collection.get(include=["metadatas"])
            if existing and existing["metadatas"]:
                for meta in existing["metadatas"]:
                    filename = meta.get("filename")
                    file_hash = meta.get("file_hash")
                    if filename and file_hash:
                        existing_file_hashes[filename] = file_hash
        except Exception as e:
            print(f"Warning: Could not check existing indexed files: {e}")

        files_to_index = []
        files_to_delete = []
        skipped_count = 0

        # Identify added/modified files
        indexed_file_keys = set(files.keys())
        for filepath, content in files.items():
            if not content.strip():
                continue
            
            # Compute current file checksum
            current_hash = hashlib.md5(content.encode("utf-8")).hexdigest()
            existing_hash = existing_file_hashes.get(filepath)

            if existing_hash != current_hash:
                files_to_index.append((filepath, content, current_hash))
                if existing_hash:
                    # File was modified; mark old records for deletion
                    files_to_delete.append(filepath)
            else:
                skipped_count += 1

        # Identify deleted files (exist in DB but missing from incoming payload)
        for filepath in existing_file_hashes.keys():
            if filepath not in files:
                files_to_delete.append(filepath)

        # 1. Surgically remove old/deleted files from collection
        for filepath in files_to_delete:
            try:
                self.collection.delete(where={"filename": filepath})
            except Exception as e:
                print(f"Error removing chunks for {filepath}: {e}")

        if not files_to_index:
            return {
                "success": True, 
                "indexed_chunks": 0, 
                "skipped_files": skipped_count, 
                "deleted_files": len(files_to_delete)
            }

        # 2. Chunk only modified/added files
        all_chunks = []
        for filepath, content, current_hash in files_to_index:
            file_chunks = self.chunk_file(filepath, content, indexed_file_keys)
            for chunk in file_chunks:
                chunk["metadata"]["file_hash"] = current_hash
            all_chunks.extend(file_chunks)

        if not all_chunks:
            return {
                "success": True, 
                "indexed_chunks": 0, 
                "skipped_files": skipped_count, 
                "deleted_files": len(files_to_delete)
            }

        # 3. Generate embeddings and index new chunks
        ids = []
        embeddings = []
        documents = []
        metadatas = []
        
        for idx, chunk in enumerate(all_chunks):
            chunk_id = f"chunk_{idx}_{chunk['metadata']['filename']}_{hashlib.md5(chunk['text'].encode('utf-8')).hexdigest()[:8]}"
            ids.append(chunk_id)
            documents.append(chunk["text"])
            metadatas.append(chunk["metadata"])
            
            if self.nvidia_client:
                try:
                    embeddings.append(self.get_embedding(chunk["text"], is_query=False))
                except Exception as e:
                    print(f"Failed to generate embedding for {chunk_id}: {e}")
                    continue
            
        if embeddings:
            self.collection.add(
                ids=ids[:len(embeddings)],
                embeddings=embeddings,
                documents=documents[:len(embeddings)],
                metadatas=metadatas[:len(embeddings)]
            )
            
        return {
            "success": True, 
            "indexed_chunks": len(embeddings),
            "skipped_files": skipped_count,
            "deleted_files": len(files_to_delete)
        }

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
