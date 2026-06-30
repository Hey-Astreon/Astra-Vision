from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
from services.hydra_router import HydraRouter
from services.self_heal_engine import SelfHealEngine

load_dotenv()

app = FastAPI(title="Astra Vision API", version="1.0.0")

# Initialize Hydra Router & Self Healing Engine
router = HydraRouter()
self_heal_engine = SelfHealEngine()

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


class ReviewPRRequest(BaseModel):
    diff: str
    verbosity: Optional[int] = 2


class IndexRepoRequest(BaseModel):
    files: dict


class SelfHealRequest(BaseModel):
    code: str
    audit_comment: str
    language: str


# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Astra Vision API"}


# Index repository endpoint
@app.post("/api/index-repo")
async def index_repo(request: IndexRepoRequest):
    if not request.files:
        raise HTTPException(status_code=400, detail="Files dictionary cannot be empty")
    
    try:
        data = router.indexer.index_repository(request.files)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Self-healing execution endpoint
@app.post("/api/self-heal")
async def self_heal(request: SelfHealRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code snippet cannot be empty")
    if not request.audit_comment.strip():
        raise HTTPException(status_code=400, detail="Audit comment cannot be empty")
    
    try:
        data = self_heal_engine.heal(request.code, request.audit_comment, request.language)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Explain code endpoint
@app.post("/api/explain-code")
async def explain_code(request: ExplainCodeRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        data = router.explain_code(request.code, request.filename)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Explain error endpoint
@app.post("/api/explain-error")
async def explain_error(request: ExplainErrorRequest):
    if not request.error.strip():
        raise HTTPException(status_code=400, detail="Error message cannot be empty")
    
    try:
        data = router.explain_error(request.error, request.code)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Generate flow diagram endpoint
@app.post("/api/generate-flow")
async def generate_flow(request: GenerateFlowRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        data = router.generate_flow(request.code)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# PR review endpoint
@app.post("/api/review-pr")
async def review_pr(request: ReviewPRRequest):
    if not request.diff.strip():
        raise HTTPException(status_code=400, detail="Diff cannot be empty")
    
    try:
        data = router.review_pr(request.diff, request.verbosity)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
