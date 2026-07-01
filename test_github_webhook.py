import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import hmac
import hashlib
import sys
import os
import json

# Ensure the backend directory is in the import path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

import server
from server import app

client = TestClient(app)

class TestGithubWebhook(unittest.TestCase):
    def setUp(self):
        # Configure test secrets and credentials in the server module
        server.GITHUB_WEBHOOK_SECRET = "test_secret"
        server.github_service.token = "mock_token"

    def _get_signature(self, payload_bytes: bytes) -> str:
        """Helper to calculate HMAC SHA-256 signature for test payloads."""
        secret = "test_secret"
        mac = hmac.new(secret.encode('utf-8'), msg=payload_bytes, digestmod=hashlib.sha256)
        return f"sha256={mac.hexdigest()}"

    @patch('server.github_service.get_pr_diff')
    @patch('server.github_service.post_pr_comment')
    @patch('server.router.review_pr')
    def test_webhook_successful_pr_review(self, mock_review_pr, mock_post_comment, mock_get_diff):
        """
        Tests that a valid pull request webhook payload successfully triggers
        the diff extraction, AI review, and comments posting cycle.
        """
        # Configure mocks
        mock_get_diff.return_value = "diff --git a/app.js b/app.js\n+console.log('test');"
        mock_review_pr.return_value = "AI Feedback: Consider using template literals."
        mock_post_comment.return_value = True

        payload = {
            "action": "opened",
            "number": 101,
            "repository": {
                "full_name": "Hey-Astreon/Astra-Vision"
            }
        }
        payload_bytes = json.dumps(payload).encode('utf-8')
        signature = self._get_signature(payload_bytes)

        # Send request to TestClient
        response = client.post(
            "/api/github-webhook",
            content=payload_bytes,
            headers={
                "X-GitHub-Event": "pull_request",
                "X-Hub-Signature-256": signature,
                "Content-Type": "application/json"
            }
        )

        print("\n--- Successful Webhook Review Test Output ---")
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "success")
        
        # Verify service invocations
        mock_get_diff.assert_called_once_with("Hey-Astreon/Astra-Vision", 101)
        mock_review_pr.assert_called_once()
        mock_post_comment.assert_called_once()

    def test_webhook_invalid_signature(self):
        """
        Tests that payloads with invalid/incorrect HMAC signatures are rejected with 403 Forbidden.
        """
        payload = {"action": "opened"}
        response = client.post(
            "/api/github-webhook",
            json=payload,
            headers={
                "X-GitHub-Event": "pull_request",
                "X-Hub-Signature-256": "sha256=incorrect_signature_hash"
            }
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["detail"], "Invalid webhook signature")

    def test_webhook_unsupported_event(self):
        """
        Tests that unsupported events (like 'ping') are gracefully ignored and return 200 OK.
        """
        payload = {"zen": "Keep it simple, stupid."}
        payload_bytes = json.dumps(payload).encode('utf-8')
        signature = self._get_signature(payload_bytes)
        
        response = client.post(
            "/api/github-webhook",
            content=payload_bytes,
            headers={
                "X-GitHub-Event": "ping",
                "X-Hub-Signature-256": signature,
                "Content-Type": "application/json"
            }
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ignored")
        self.assertIn("Unsupported event type", response.json()["reason"])

    def test_webhook_unsupported_action(self):
        """
        Tests that unsupported pull request actions (like 'closed') are gracefully ignored and return 200 OK.
        """
        payload = {
            "action": "closed",
            "number": 101,
            "repository": {
                "full_name": "Hey-Astreon/Astra-Vision"
            }
        }
        payload_bytes = json.dumps(payload).encode('utf-8')
        signature = self._get_signature(payload_bytes)

        response = client.post(
            "/api/github-webhook",
            content=payload_bytes,
            headers={
                "X-GitHub-Event": "pull_request",
                "X-Hub-Signature-256": signature,
                "Content-Type": "application/json"
            }
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ignored")
        self.assertIn("Unsupported pull_request action", response.json()["reason"])


if __name__ == "__main__":
    unittest.main()
