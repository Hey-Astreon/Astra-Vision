import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import json
import sys
import os

# Ensure the backend directory is in the import path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

import server
from server import app

client = TestClient(app)

class TestHistory(unittest.TestCase):
    def setUp(self):
        # Configure local mock credentials
        server.github_service.token = "mock_token"
        
    @patch('server.self_heal_engine.heal')
    @patch('server.router.indexer.log_history')
    def test_self_heal_logging(self, mock_log_history, mock_heal):
        """
        Verifies that running self-healing automatically logs the operation details
        and results to the ChromaDB action memory collection.
        """
        # Setup mocks
        mock_heal.return_value = {
            "test_code": "assert True",
            "fixed_code": "print('healed')",
            "error_output": "",
            "run_output": "PASS"
        }
        
        # Fire self-heal request
        response = client.post(
            "/api/self-heal",
            json={
                "code": "def buggy(): pass",
                "audit_comment": "Fix buggy function",
                "language": "python"
            }
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        
        # Ensure it attempted to write to the semantic history logs
        mock_log_history.assert_called_once()
        args, kwargs = mock_log_history.call_args
        self.assertEqual(args[0], "self_heal")
        self.assertEqual(args[1], "python")
        self.assertIn("Self-healed warning in python block", args[2])

    @patch('server.router.explain_code')
    @patch('server.router.indexer.log_history')
    def test_explain_code_logging(self, mock_log_history, mock_explain):
        """
        Verifies that running code explanation automatically logs the results overview
        to the ChromaDB action memory collection.
        """
        # Setup mocks
        mock_explain.return_value = {
            "overview": "Matches everything",
            "breakdown": ["Step 1"],
            "difficulty": "basic"
        }
        
        # Fire explain-code request
        response = client.post(
            "/api/explain-code",
            json={
                "code": "x = 42",
                "filename": "math.py"
            }
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        
        # Ensure it attempted to write to the semantic history logs
        mock_log_history.assert_called_once()
        args, kwargs = mock_log_history.call_args
        self.assertEqual(args[0], "explanation")
        self.assertEqual(args[1], "math.py")
        self.assertIn("Explained file math.py", args[2])

    @patch('server.router.indexer.get_history')
    def test_get_history_endpoint(self, mock_get_history):
        """
        Verifies that GET /api/history returns recent timeline records correctly.
        """
        mock_get_history.return_value = [
            {"id": "hist_1", "summary": "Explained math.py", "metadata": {"type": "explanation"}}
        ]
        
        response = client.get("/api/history?limit=10")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        self.assertEqual(len(response.json()["data"]), 1)
        mock_get_history.assert_called_once_with(limit=10)

    @patch('server.router.indexer.search_history')
    def test_search_history_endpoint(self, mock_search_history):
        """
        Verifies that POST /api/history/search queries past actions semantically.
        """
        mock_search_history.return_value = [
            {"id": "hist_1", "summary": "Explained math.py", "metadata": {"type": "explanation"}}
        ]
        
        response = client.post("/api/history/search", json={"query": "math"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        mock_search_history.assert_called_once_with("math")

if __name__ == "__main__":
    unittest.main()
