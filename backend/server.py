from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import json
from dotenv import load_dotenv
from services.hydra_router import HydraRouter
from services.self_heal_engine import SelfHealEngine
from services.github_service import GithubService

load_dotenv()

app = FastAPI(title="Astra Vision API", version="1.0.0")

# Initialize Router, Self Healing, and GitHub Service
router = HydraRouter()
self_heal_engine = SelfHealEngine()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")
github_service = GithubService(token=GITHUB_TOKEN)

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


class SearchHistoryRequest(BaseModel):
    query: str


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
        
        # Log self-heal action to history collection
        summary = f"⚡ Self-healed warning in {request.language} block: {request.audit_comment[:60]}"
        router.indexer.log_history("self_heal", request.language, summary, {
            "code": request.code,
            "audit_comment": request.audit_comment,
            "language": request.language,
            "results": data
        })
        
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
        
        # Log explanation action to history collection
        summary = f"📖 Explained file {request.filename or 'unknown'}"
        router.indexer.log_history("explanation", request.filename, summary, {
            "code": request.code,
            "filename": request.filename,
            "results": data
        })
        
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


# GitHub webhook endpoint
@app.post("/api/github-webhook")
async def github_webhook(
    request: Request,
    x_github_event: Optional[str] = Header(None),
    x_hub_signature_256: Optional[str] = Header(None)
):
    body = await request.body()
    
    # 1. Verify HMAC SHA256 webhook signature for security
    if GITHUB_WEBHOOK_SECRET:
        if not github_service.verify_signature(body, x_hub_signature_256, GITHUB_WEBHOOK_SECRET):
            raise HTTPException(status_code=403, detail="Invalid webhook signature")
    
    # 2. Parse JSON payload
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    # 3. Only process pull_request events
    if x_github_event != "pull_request":
        return {"status": "ignored", "reason": f"Unsupported event type: {x_github_event}"}
    
    action = payload.get("action")
    # We trigger audits on PR opened or updated (synchronize)
    if action not in ["opened", "synchronize"]:
        return {"status": "ignored", "reason": f"Unsupported pull_request action: {action}"}
    
    # 4. Extract repository name and PR number
    repo_name = payload.get("repository", {}).get("full_name")
    pr_number = payload.get("number")
    
    if not repo_name or not pr_number:
        raise HTTPException(status_code=400, detail="Missing repository name or PR number in payload")
    
    try:
        # 5. Fetch code diff from GitHub
        diff = github_service.get_pr_diff(repo_name, pr_number)
        if not diff.strip():
            return {"status": "ignored", "reason": "Pull request has empty diff"}
        
        # 6. Run Nvidia Nemotron PR audit
        audit_results = router.review_pr(diff, verbosity=2)
        
        # 7. Formulate AI review comment
        review_comment = (
            "## 🌌 Astra Vision Automated PR Review\n\n"
            f"I have reviewed the changes in PR #{pr_number} using the Nvidia Nemotron engine. "
            "Here are my findings:\n\n"
        )
        
        # Check if audit_results is dict or string
        if isinstance(audit_results, dict) and "review" in audit_results:
            review_comment += audit_results["review"]
        elif isinstance(audit_results, str):
            review_comment += audit_results
        else:
            review_comment += str(audit_results)
            
        review_comment += "\n\n---\n*Self-hosted with love by Astra Vision Startup Engine 🚀*"
        
        # 8. Post comment to the PR issue thread
        github_service.post_pr_comment(repo_name, pr_number, review_comment)
        
        return {
            "status": "success",
            "message": f"Review comment posted successfully to {repo_name} PR #{pr_number}"
        }
    except Exception as e:
        print(f"Error handling GitHub webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Get action history endpoint
@app.get("/api/history")
async def get_history(limit: Optional[int] = 20):
    try:
        data = router.indexer.get_history(limit=limit)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Search action history endpoint
@app.post("/api/history/search")
async def search_history(request: SearchHistoryRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    
    try:
        data = router.indexer.search_history(request.query)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
