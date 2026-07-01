import hmac
import hashlib
import httpx
from github import Github
import logging

logger = logging.getLogger("AstraVision.GithubService")

class GithubService:
    """
    Service to handle GitHub Webhook logic: verifying payloads,
    fetching pull request diffs, and posting code review comments.
    """
    def __init__(self, token: str = None):
        self.token = token
        self.gh = Github(token) if token else None
        if not token:
            logger.warning("GithubService initialized without GITHUB_TOKEN. Cannot post comments.")

    def verify_signature(self, payload_body: bytes, signature_header: str, secret: str) -> bool:
        """
        Verifies the HMAC SHA-256 signature of the incoming GitHub webhook payload.
        """
        if not secret:
            logger.info("No GITHUB_WEBHOOK_SECRET set. Skipping verification.")
            return True
        if not signature_header:
            logger.error("Missing X-Hub-Signature-256 header.")
            return False
        
        try:
            sha_name, signature = signature_header.split('=')
            if sha_name != 'sha256':
                logger.error(f"Unsupported signature hash algorithm: {sha_name}")
                return False
            
            mac = hmac.new(secret.encode('utf-8'), msg=payload_body, digestmod=hashlib.sha256)
            is_valid = hmac.compare_digest(mac.hexdigest(), signature)
            if not is_valid:
                logger.error("HMAC signature verification failed.")
            return is_valid
        except Exception as e:
            logger.error(f"Error during signature verification: {str(e)}")
            return False

    def get_pr_diff(self, repo_full_name: str, pr_number: int) -> str:
        """
        Fetches the raw git diff text for a given Pull Request using GitHub API.
        """
        headers = {"Accept": "application/vnd.github.v3.diff"}
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        
        url = f"https://api.github.com/repos/{repo_full_name}/pulls/{pr_number}"
        logger.info(f"Fetching diff from URL: {url}")
        
        with httpx.Client() as client:
            response = client.get(url, headers=headers, follow_redirects=True)
            if response.status_code != 200:
                raise Exception(f"Failed to fetch PR diff: {response.status_code} - {response.text}")
            return response.text

    def post_pr_comment(self, repo_full_name: str, pr_number: int, body: str) -> bool:
        """
        Posts a code review comment to the Pull Request issue timeline using PyGithub.
        """
        if not self.gh:
            raise Exception("GitHub client not initialized. Please configure GITHUB_TOKEN.")
        
        logger.info(f"Posting review comment to {repo_full_name} PR #{pr_number}")
        try:
            repo = self.gh.get_repo(repo_full_name)
            pr = repo.get_pull(pr_number)
            pr.create_issue_comment(body)
            return True
        except Exception as e:
            logger.error(f"Failed to post comment via PyGithub: {str(e)}")
            raise e
