#!/usr/bin/env python3
"""
Backend API Testing for Astra Vision
Tests all three AI endpoints with proper safety guards and response format validation
"""

import requests
import sys
import json
from datetime import datetime

class AstraVisionAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_health_endpoint(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy" and data.get("service") == "Astra Vision API":
                    self.log_test("Health Check", True)
                    return True
                else:
                    self.log_test("Health Check", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_explain_code_endpoint(self):
        """Test explain code endpoint with various scenarios"""
        test_cases = [
            {
                "name": "Explain Code - Valid Request",
                "payload": {
                    "code": "function greet(name) {\n  return \"Hello \" + name;\n}",
                    "filename": "app.js",
                    "language": "javascript"
                },
                "expected_status": 200,
                "should_succeed": True
            },
            {
                "name": "Explain Code - Empty Code (Safety Guard)",
                "payload": {
                    "code": "",
                    "filename": "app.js"
                },
                "expected_status": 400,
                "should_succeed": False
            },
            {
                "name": "Explain Code - Whitespace Only (Safety Guard)",
                "payload": {
                    "code": "   \n\t  ",
                    "filename": "app.js"
                },
                "expected_status": 400,
                "should_succeed": False
            }
        ]
        
        for test_case in test_cases:
            try:
                response = requests.post(
                    f"{self.base_url}/api/explain-code",
                    json=test_case["payload"],
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == test_case["expected_status"]:
                    if test_case["should_succeed"]:
                        # Validate success response format
                        data = response.json()
                        if (data.get("success") is True and 
                            isinstance(data.get("data"), dict) and
                            "overview" in data["data"] and
                            "key_parts" in data["data"] and
                            "summary" in data["data"]):
                            self.log_test(test_case["name"], True)
                        else:
                            self.log_test(test_case["name"], False, f"Invalid response format: {data}")
                    else:
                        # Validate error response
                        self.log_test(test_case["name"], True)
                else:
                    self.log_test(test_case["name"], False, f"Expected {test_case['expected_status']}, got {response.status_code}")
                    
            except Exception as e:
                self.log_test(test_case["name"], False, f"Exception: {str(e)}")

    def test_explain_error_endpoint(self):
        """Test explain error endpoint with various scenarios"""
        test_cases = [
            {
                "name": "Explain Error - Valid Request",
                "payload": {
                    "error": "TypeError: Cannot read property 'length' of undefined",
                    "code": "const arr = undefined; console.log(arr.length);"
                },
                "expected_status": 200,
                "should_succeed": True
            },
            {
                "name": "Explain Error - Empty Error (Safety Guard)",
                "payload": {
                    "error": "",
                    "code": "some code"
                },
                "expected_status": 400,
                "should_succeed": False
            },
            {
                "name": "Explain Error - Whitespace Only (Safety Guard)",
                "payload": {
                    "error": "   \n\t  ",
                    "code": "some code"
                },
                "expected_status": 400,
                "should_succeed": False
            }
        ]
        
        for test_case in test_cases:
            try:
                response = requests.post(
                    f"{self.base_url}/api/explain-error",
                    json=test_case["payload"],
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == test_case["expected_status"]:
                    if test_case["should_succeed"]:
                        # Validate success response format
                        data = response.json()
                        if (data.get("success") is True and 
                            isinstance(data.get("data"), dict) and
                            "meaning" in data["data"] and
                            "cause" in data["data"] and
                            "fix" in data["data"]):
                            self.log_test(test_case["name"], True)
                        else:
                            self.log_test(test_case["name"], False, f"Invalid response format: {data}")
                    else:
                        # Validate error response
                        self.log_test(test_case["name"], True)
                else:
                    self.log_test(test_case["name"], False, f"Expected {test_case['expected_status']}, got {response.status_code}")
                    
            except Exception as e:
                self.log_test(test_case["name"], False, f"Exception: {str(e)}")

    def test_generate_flow_endpoint(self):
        """Test generate flow endpoint with various scenarios"""
        test_cases = [
            {
                "name": "Generate Flow - Valid Request",
                "payload": {
                    "code": "function processData(input) {\n  if (input) {\n    return input.toUpperCase();\n  }\n  return null;\n}",
                    "filename": "processor.js"
                },
                "expected_status": 200,
                "should_succeed": True
            },
            {
                "name": "Generate Flow - Empty Code (Safety Guard)",
                "payload": {
                    "code": "",
                    "filename": "app.js"
                },
                "expected_status": 400,
                "should_succeed": False
            },
            {
                "name": "Generate Flow - Whitespace Only (Safety Guard)",
                "payload": {
                    "code": "   \n\t  ",
                    "filename": "app.js"
                },
                "expected_status": 400,
                "should_succeed": False
            }
        ]
        
        for test_case in test_cases:
            try:
                response = requests.post(
                    f"{self.base_url}/api/generate-flow",
                    json=test_case["payload"],
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == test_case["expected_status"]:
                    if test_case["should_succeed"]:
                        # Validate success response format
                        data = response.json()
                        if (data.get("success") is True and 
                            isinstance(data.get("data"), dict) and
                            "diagram" in data["data"] and
                            isinstance(data["data"]["diagram"], str)):
                            self.log_test(test_case["name"], True)
                        else:
                            self.log_test(test_case["name"], False, f"Invalid response format: {data}")
                    else:
                        # Validate error response
                        self.log_test(test_case["name"], True)
                else:
                    self.log_test(test_case["name"], False, f"Expected {test_case['expected_status']}, got {response.status_code}")
                    
            except Exception as e:
                self.log_test(test_case["name"], False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Astra Vision Backend API Tests")
        print("=" * 50)
        
        # Test health endpoint first
        if not self.test_health_endpoint():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Test all AI endpoints
        self.test_explain_code_endpoint()
        self.test_explain_error_endpoint()
        self.test_generate_flow_endpoint()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test execution"""
    print(f"Testing at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test locally since external URL is not working
    tester = AstraVisionAPITester("http://localhost:8001")
    success = tester.run_all_tests()
    
    # Also test external URL to confirm it's still broken
    print("\n" + "=" * 50)
    print("🌐 Testing External URL (Expected to Fail)")
    external_tester = AstraVisionAPITester("https://ai-dev-brain-cferxrtx.preview.emergentagent.com")
    external_success = external_tester.test_health_endpoint()
    
    if not external_success:
        print("❌ External URL still not accessible - deployment issue persists")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())