from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Astra Vision API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request models
class ExplainCodeRequest(BaseModel):
    code: str
    filename: Optional[str] = None
    language: Optional[str] = None


class ExplainErrorRequest(BaseModel):
    error: str
    code: Optional[str] = None


class GenerateFlowRequest(BaseModel):
    code: str
    filename: Optional[str] = None


# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Astra Vision API"}


# Explain code endpoint
@app.post("/api/explain-code")
async def explain_code(request: ExplainCodeRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    # Mock structured response with success wrapper
    return {
        "success": True,
        "data": {
            "overview": "This code defines functions and handles logic step by step.",
            "key_parts": "Includes functions, variables, and control flow such as loops and conditions.",
            "summary": "Overall, the code processes input and produces structured output."
        }
    }


# Explain error endpoint
@app.post("/api/explain-error")
async def explain_error(request: ExplainErrorRequest):
    if not request.error.strip():
        raise HTTPException(status_code=400, detail="Error message cannot be empty")
    
    # Mock structured response with success wrapper
    return {
        "success": True,
        "data": {
            "meaning": "This error indicates something went wrong in the code execution.",
            "cause": "Likely due to syntax issues or undefined variables.",
            "fix": "Check your syntax and ensure all variables are properly defined before use."
        }
    }


# Generate flow diagram endpoint
@app.post("/api/generate-flow")
async def generate_flow(request: GenerateFlowRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    # Mock Mermaid diagram with success wrapper
    return {
        "success": True,
        "data": {
            "diagram": "graph TD; A[Start] --> B[Process Code]; B --> C[End];"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
