#!/usr/bin/env python3
"""
Backend API Testing for TickFlow Study Tracker
Tests all backend endpoints with realistic data
"""

import requests
import json
import random
from datetime import datetime, timedelta

# Backend URL from environment
BASE_URL = "https://study-flow-app-1.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_date = "2026-03-17"  # Test date as specified
        self.passed_tests = 0
        self.total_tests = 0
        self.failed_tests = []

    def log(self, message, level="INFO"):
        print(f"[{level}] {message}")

    def test_api(self, method, endpoint, data=None, params=None, expected_status=200, test_name=""):
        """Generic API test method"""
        self.total_tests += 1
        url = f"{API_URL}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, params=params)
            elif method.upper() == "POST":
                if data:
                    response = self.session.post(url, json=data, params=params)
                else:
                    response = self.session.post(url, params=params)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, params=params)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, params=params)
            
            self.log(f"Testing {method} {endpoint} - {test_name}")
            self.log(f"Status: {response.status_code}, Expected: {expected_status}")
            
            if response.status_code == expected_status:
                self.passed_tests += 1
                self.log(f"✅ PASSED: {test_name}", "SUCCESS")
                return response.json() if response.content else None
            else:
                error_msg = f"❌ FAILED: {test_name} - Status {response.status_code}, Expected {expected_status}"
                if response.content:
                    error_msg += f", Response: {response.text[:200]}"
                self.log(error_msg, "ERROR")
                self.failed_tests.append(f"{test_name}: {error_msg}")
                return None
                
        except Exception as e:
            error_msg = f"❌ EXCEPTION: {test_name} - {str(e)}"
            self.log(error_msg, "ERROR")
            self.failed_tests.append(f"{test_name}: {error_msg}")
            return None

    def test_quotes_apis(self):
        """Test all quote-related APIs - HIGH PRIORITY"""
        self.log("\n=== TESTING QUOTES APIs (HIGH PRIORITY) ===", "INFO")
        
        # Test GET /api/quotes/all - Should return 66+ quotes
        all_quotes = self.test_api("GET", "/quotes/all", test_name="Get All Quotes")
        if all_quotes:
            quote_count = len(all_quotes)
            self.log(f"Total quotes returned: {quote_count}")
            if quote_count >= 66:
                self.log(f"✅ Quote count requirement met: {quote_count} >= 66", "SUCCESS")
                # Check for specific book quotes
                book_quotes_found = {
                    "Atomic Habits": False,
                    "Ikigai": False, 
                    "Zero to One": False
                }
                
                for quote in all_quotes:
                    author = quote.get("author", "")
                    if "Atomic Habits" in author:
                        book_quotes_found["Atomic Habits"] = True
                    if "Ikigai" in author:
                        book_quotes_found["Ikigai"] = True
                    if "Zero to One" in author:
                        book_quotes_found["Zero to One"] = True
                
                for book, found in book_quotes_found.items():
                    if found:
                        self.log(f"✅ Found quotes from {book}", "SUCCESS")
                    else:
                        self.log(f"❌ Missing quotes from {book}", "ERROR")
                        self.failed_tests.append(f"Missing quotes from {book}")
            else:
                self.log(f"❌ Insufficient quotes: {quote_count} < 66", "ERROR")
                self.failed_tests.append(f"Only {quote_count} quotes found, need 66+")
        
        # Test GET /api/quotes/daily - Should return consistent daily quote
        daily_quote1 = self.test_api("GET", "/quotes/daily", test_name="Get Daily Quote (First Call)")
        daily_quote2 = self.test_api("GET", "/quotes/daily", test_name="Get Daily Quote (Second Call)")
        
        if daily_quote1 and daily_quote2:
            if daily_quote1 == daily_quote2:
                self.log("✅ Daily quote is consistent across calls", "SUCCESS")
            else:
                self.log("❌ Daily quote should be consistent", "ERROR")
                self.failed_tests.append("Daily quote inconsistent across calls")
        
        # Test GET /api/quotes/random - Should return different quotes
        random_quote1 = self.test_api("GET", "/quotes/random", test_name="Get Random Quote (First Call)")
        random_quote2 = self.test_api("GET", "/quotes/random", test_name="Get Random Quote (Second Call)")
        
        if random_quote1 and random_quote2:
            # Note: Random quotes might be the same by chance, so we'll just verify they're valid
            if "text" in random_quote1 and "author" in random_quote1:
                self.log("✅ Random quotes have proper structure", "SUCCESS")
            else:
                self.log("❌ Random quote missing required fields", "ERROR")
                self.failed_tests.append("Random quote structure invalid")

        # Test GET /api/quotes/read - Should return read indices list
        read_quotes = self.test_api("GET", "/quotes/read", test_name="Get Read Quotes List")
        if read_quotes and "readIndices" in read_quotes:
            self.log(f"✅ Read quotes returned: {read_quotes['readIndices']}", "SUCCESS")
        
        # Test POST /api/quotes/read/0 - Should toggle read status
        toggle_result1 = self.test_api("POST", "/quotes/read/0", test_name="Toggle Quote 0 to Read")
        if toggle_result1 and "action" in toggle_result1:
            self.log(f"✅ Quote toggle result: {toggle_result1['action']}", "SUCCESS")
        
        # Test POST /api/quotes/read/0 again - Should untoggle (remove from read list)
        toggle_result2 = self.test_api("POST", "/quotes/read/0", test_name="Toggle Quote 0 Again (Untoggle)")
        if toggle_result2 and "action" in toggle_result2:
            if toggle_result1 and toggle_result2["action"] != toggle_result1["action"]:
                self.log("✅ Quote toggle working correctly (different actions)", "SUCCESS")
            else:
                self.log("❌ Quote toggle not working properly", "ERROR")
                self.failed_tests.append("Quote toggle not changing action")

    def test_tracker_apis(self):
        """Test tracker CRUD operations"""
        self.log("\n=== TESTING TRACKER APIs ===", "INFO")
        
        # Test GET /api/tracker/{date} - Should return tracker or create default
        tracker = self.test_api("GET", f"/tracker/{self.test_date}", test_name=f"Get Tracker for {self.test_date}")
        if tracker:
            if "timeSlots" in tracker and len(tracker["timeSlots"]) > 0:
                self.log(f"✅ Tracker returned with {len(tracker['timeSlots'])} time slots", "SUCCESS")
            else:
                self.log("❌ Tracker missing time slots", "ERROR")
                self.failed_tests.append("Tracker missing time slots")
        
        # Test POST /api/tracker - Update tracker with realistic study data
        if tracker:
            # Update tracker with realistic student study data
            tracker_update = {
                "date": self.test_date,
                "day": "Monday", 
                "totalStudyHours": {"hrs": 6, "min": 30},
                "mood": 4,
                "timeSlots": [
                    {
                        "timeRange": "9:00-10:30 AM",
                        "subject": "Mathematics",
                        "topic": "Calculus - Integration by Parts",
                        "practice": True,
                        "revision": False,
                        "notes": "Focused on u-substitution method",
                        "timeSpent": 5400,  # 90 minutes
                        "remarks": "Good progress on complex problems",
                        "isBreak": False
                    },
                    {
                        "timeRange": "10:30-10:45 AM",
                        "subject": "Short Break",
                        "topic": "",
                        "practice": False,
                        "revision": False,
                        "notes": "",
                        "timeSpent": 900,  # 15 minutes
                        "remarks": "",
                        "isBreak": True
                    }
                ],
                "dailyReflection": {
                    "revisionsCompleted": "Completed chapters 12-14 of calculus textbook",
                    "topicsToRevise": "Need to review logarithmic integration",
                    "nextDayPlan": "Start with physics - mechanics problems",
                    "weakAreas": "Integration by partial fractions still challenging",
                    "syllabusCovered": "60% of calculus syllabus complete",
                    "productivity": 8
                },
                "isCompleted": False
            }
            
            update_result = self.test_api("POST", "/tracker", data=tracker_update, test_name="Update Tracker with Study Data")
            if update_result and update_result.get("date") == self.test_date:
                self.log("✅ Tracker updated successfully", "SUCCESS")
            
        # Test GET /api/tracker/recent/list - Should return recent trackers
        recent_trackers = self.test_api("GET", "/tracker/recent/list", test_name="Get Recent Trackers")
        if recent_trackers and isinstance(recent_trackers, list):
            self.log(f"✅ Retrieved {len(recent_trackers)} recent trackers", "SUCCESS")
        
        # Test POST /api/tracker/complete/{date} - Mark day complete
        complete_result = self.test_api("POST", f"/tracker/complete/{self.test_date}", test_name=f"Mark Day Complete - {self.test_date}")
        if complete_result and "streak" in complete_result:
            self.log(f"✅ Day marked complete, streak: {complete_result['streak']}", "SUCCESS")

    def test_streak_api(self):
        """Test streak calculation"""
        self.log("\n=== TESTING STREAK API ===", "INFO")
        
        # Test GET /api/streak - Should return streak data
        streak_data = self.test_api("GET", "/streak", test_name="Get Streak Data")
        if streak_data:
            required_fields = ["currentStreak", "longestStreak", "completedDates"]
            missing_fields = [field for field in required_fields if field not in streak_data]
            
            if not missing_fields:
                self.log(f"✅ Streak data complete: Current={streak_data['currentStreak']}, Longest={streak_data['longestStreak']}", "SUCCESS")
            else:
                self.log(f"❌ Streak data missing fields: {missing_fields}", "ERROR")
                self.failed_tests.append(f"Streak data missing: {missing_fields}")

        # Test that Mark Day Complete increments streak by marking another day
        next_day = "2026-03-18"
        complete_next = self.test_api("POST", f"/tracker/complete/{next_day}", test_name=f"Mark Next Day Complete - {next_day}")
        if complete_next and "streak" in complete_next:
            new_streak = complete_next["streak"]
            if new_streak > (streak_data.get("currentStreak", 0) if streak_data else 0):
                self.log(f"✅ Streak incremented correctly to {new_streak}", "SUCCESS")
            else:
                self.log(f"❌ Streak did not increment properly: {new_streak}", "ERROR")
                self.failed_tests.append(f"Streak not incrementing: {new_streak}")

    def test_timeslot_management(self):
        """Test time slot management APIs"""
        self.log("\n=== TESTING TIME SLOT MANAGEMENT APIs ===", "INFO")
        
        # First ensure we have a tracker with time slots
        tracker = self.test_api("GET", f"/tracker/{self.test_date}", test_name=f"Get Tracker for Time Slot Test")
        
        if tracker and "timeSlots" in tracker:
            original_slot_count = len(tracker["timeSlots"])
            self.log(f"Original time slot count: {original_slot_count}")
            
            if original_slot_count > 0:
                # Test DELETE /api/tracker/{date}/timeslot/{index}
                delete_result = self.test_api("DELETE", f"/tracker/{self.test_date}/timeslot/0", 
                                            test_name="Delete Time Slot at Index 0")
                
                if delete_result:
                    # Verify deletion by getting tracker again
                    updated_tracker = self.test_api("GET", f"/tracker/{self.test_date}", 
                                                   test_name="Verify Time Slot Deletion")
                    
                    if updated_tracker and len(updated_tracker["timeSlots"]) == original_slot_count - 1:
                        self.log("✅ Time slot deleted successfully", "SUCCESS")
                    else:
                        self.log("❌ Time slot deletion not reflected", "ERROR")
                        self.failed_tests.append("Time slot deletion failed")
                
                # Test DELETE with invalid index
                self.test_api("DELETE", f"/tracker/{self.test_date}/timeslot/999", 
                            expected_status=400, test_name="Delete Invalid Time Slot Index (Should Fail)")
            else:
                self.log("❌ No time slots available for deletion test", "ERROR")
                self.failed_tests.append("No time slots for deletion test")

    def run_all_tests(self):
        """Run all backend tests"""
        self.log("Starting Backend API Testing for TickFlow Study Tracker", "INFO")
        self.log(f"Base URL: {BASE_URL}", "INFO")
        
        # Test basic connectivity
        try:
            response = self.session.get(f"{API_URL}/")
            if response.status_code == 200:
                self.log("✅ Backend connectivity confirmed", "SUCCESS")
            else:
                self.log(f"❌ Backend connectivity issue: {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"❌ Backend connection failed: {e}", "ERROR")
            return
        
        # Run all test suites
        self.test_quotes_apis()  # HIGH PRIORITY
        self.test_tracker_apis()
        self.test_streak_api() 
        self.test_timeslot_management()
        
        # Print final results
        self.log("\n" + "="*60, "INFO")
        self.log("BACKEND TEST RESULTS SUMMARY", "INFO")
        self.log("="*60, "INFO")
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        self.log(f"Tests Passed: {self.passed_tests}/{self.total_tests} ({success_rate:.1f}%)", "INFO")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS:", "ERROR")
            for i, failure in enumerate(self.failed_tests, 1):
                self.log(f"  {i}. {failure}", "ERROR")
        else:
            self.log("\n✅ ALL TESTS PASSED!", "SUCCESS")
        
        return success_rate, self.passed_tests, self.total_tests, self.failed_tests

if __name__ == "__main__":
    tester = BackendTester()
    success_rate, passed, total, failures = tester.run_all_tests()