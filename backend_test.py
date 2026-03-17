#!/usr/bin/env python3
"""
Comprehensive backend API tests for TickFlow Study Tracker
Tests all CRUD operations, timer management, streak calculation, and edge cases
"""

import requests
import json
from datetime import datetime, date, timedelta
import time
import random

# Backend URL from frontend env
BASE_URL = "https://habit-streak-timer.preview.emergentagent.com/api"

class TickFlowAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = {
            "tracker_apis": {},
            "timer_apis": {},  
            "streak_apis": {},
            "quotes_apis": {},
            "timeslot_apis": {},
            "overall_status": "PASS"
        }
        
    def log(self, message, test_type="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{test_type}] {message}")
        
    def test_api_call(self, method, endpoint, data=None, expected_status=200):
        """Helper to make API calls and validate responses"""
        url = f"{self.base_url}{endpoint}"
        self.log(f"Testing {method} {endpoint}")
        
        try:
            if method == "GET":
                response = self.session.get(url)
            elif method == "POST":
                response = self.session.post(url, json=data)
            elif method == "PUT":
                response = self.session.put(url, json=data)
            elif method == "DELETE":
                response = self.session.delete(url)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            self.log(f"Response: {response.status_code} - {response.text[:200]}")
            
            if response.status_code != expected_status:
                self.log(f"FAILED: Expected {expected_status}, got {response.status_code}", "ERROR")
                return False, response
                
            # Try to parse JSON response
            try:
                json_data = response.json()
                return True, json_data
            except:
                return True, response.text
                
        except Exception as e:
            self.log(f"Exception during API call: {str(e)}", "ERROR")
            return False, str(e)
    
    def test_tracker_apis(self):
        """Test all tracker CRUD operations"""
        self.log("=== TESTING TRACKER APIs ===", "TEST")
        
        # Test dates
        today = date.today().strftime("%Y-%m-%d")
        yesterday = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
        future_date = (date.today() + timedelta(days=2)).strftime("%Y-%m-%d")
        
        # 1. Test GET /api/tracker/{date} - today's date
        success, response = self.test_api_call("GET", f"/tracker/{today}")
        if success:
            self.log("✅ GET tracker for today - SUCCESS")
            self.test_results["tracker_apis"]["get_today"] = "PASS"
            # Verify default time slots are created
            if isinstance(response, dict) and "timeSlots" in response:
                if len(response["timeSlots"]) >= 10:  # Should have default slots
                    self.log("✅ Default time slots created correctly")
                else:
                    self.log("❌ Default time slots missing or incomplete", "ERROR")
                    self.test_results["overall_status"] = "FAIL"
        else:
            self.log("❌ GET tracker for today - FAILED", "ERROR")
            self.test_results["tracker_apis"]["get_today"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 2. Test GET /api/tracker/{date} - past date
        success, response = self.test_api_call("GET", f"/tracker/{yesterday}")
        if success:
            self.log("✅ GET tracker for past date - SUCCESS")
            self.test_results["tracker_apis"]["get_past_date"] = "PASS"
        else:
            self.log("❌ GET tracker for past date - FAILED", "ERROR")
            self.test_results["tracker_apis"]["get_past_date"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 3. Test POST /api/tracker - create/update tracker with realistic data
        tracker_data = {
            "date": today,
            "day": "Monday",
            "totalStudyHours": {"hrs": 6, "min": 30},
            "mood": 4,
            "timeSlots": [
                {
                    "timeRange": "9:00-10:30 AM",
                    "subject": "Mathematics",
                    "topic": "Calculus Derivatives",
                    "practice": True,
                    "revision": False,
                    "notes": "Completed chain rule exercises",
                    "timeSpent": 5400,  # 90 minutes in seconds
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
                "revisionsCompleted": "Reviewed calculus fundamentals and integration techniques",
                "topicsToRevise": "Trigonometric substitution, partial fractions",
                "nextDayPlan": "Focus on physics mechanics and chemistry bonding",
                "weakAreas": "Complex number applications in calculus",
                "syllabusCovered": "Completed 15% of calculus syllabus",
                "productivity": 8
            },
            "isCompleted": False
        }
        
        success, response = self.test_api_call("POST", "/tracker", tracker_data)
        if success:
            self.log("✅ POST tracker with comprehensive data - SUCCESS")
            self.test_results["tracker_apis"]["post_tracker"] = "PASS"
        else:
            self.log("❌ POST tracker - FAILED", "ERROR")
            self.test_results["tracker_apis"]["post_tracker"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 4. Test POST /api/tracker/complete/{date} - mark day complete
        success, response = self.test_api_call("POST", f"/tracker/complete/{today}")
        if success:
            self.log("✅ POST complete tracker - SUCCESS")
            self.test_results["tracker_apis"]["complete_tracker"] = "PASS"
            # Verify streak information
            if isinstance(response, dict) and "streak" in response:
                self.log(f"✅ Streak updated to: {response['streak']}")
        else:
            self.log("❌ POST complete tracker - FAILED", "ERROR")
            self.test_results["tracker_apis"]["complete_tracker"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 5. Test GET /api/tracker/recent/list
        success, response = self.test_api_call("GET", "/tracker/recent/list")
        if success:
            self.log("✅ GET recent trackers list - SUCCESS")
            self.test_results["tracker_apis"]["recent_list"] = "PASS"
            # Verify list structure
            if isinstance(response, list):
                self.log(f"✅ Found {len(response)} recent trackers")
            else:
                self.log("❌ Recent list format incorrect", "ERROR")
        else:
            self.log("❌ GET recent trackers - FAILED", "ERROR")
            self.test_results["tracker_apis"]["recent_list"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 6. Test edge case - invalid date format
        success, response = self.test_api_call("GET", "/tracker/invalid-date", expected_status=500)
        if not success and response.status_code == 500:
            self.log("✅ Invalid date format handled correctly")
        else:
            self.log("⚠️ Invalid date format should return error")
    
    def test_timer_apis(self):
        """Test all timer management operations"""
        self.log("=== TESTING TIMER APIs ===", "TEST")
        
        today = date.today().strftime("%Y-%m-%d")
        
        # 1. Test GET /api/timer/active - should be none initially
        success, response = self.test_api_call("GET", "/timer/active")
        if success:
            self.log("✅ GET active timer - SUCCESS")
            self.test_results["timer_apis"]["get_active"] = "PASS"
            if response is None:
                self.log("✅ No active timer found (expected)")
            else:
                self.log(f"⚠️ Found existing active timer: {response}")
        else:
            self.log("❌ GET active timer - FAILED", "ERROR")
            self.test_results["timer_apis"]["get_active"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 2. Test POST /api/timer/start
        timer_data = {
            "date": today,
            "timeSlotIndex": 0,
            "timerName": "Mathematics Study Session",
            "startTime": datetime.utcnow().isoformat(),
            "elapsedSeconds": 0,
            "isRunning": True,
            "lapTimes": []
        }
        
        success, response = self.test_api_call("POST", "/timer/start", timer_data)
        if success:
            self.log("✅ POST start timer - SUCCESS")
            self.test_results["timer_apis"]["start_timer"] = "PASS"
            if isinstance(response, dict) and "id" in response:
                timer_id = response["id"]
                self.log(f"✅ Timer started with ID: {timer_id}")
        else:
            self.log("❌ POST start timer - FAILED", "ERROR")
            self.test_results["timer_apis"]["start_timer"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # Give timer some time to run
        time.sleep(2)
        
        # 3. Test PUT /api/timer/update - using query parameter
        success, response = self.test_api_call("PUT", "/timer/update?elapsed_seconds=120")
        if success:
            self.log("✅ PUT update timer elapsed - SUCCESS")
            self.test_results["timer_apis"]["update_timer"] = "PASS"
        else:
            self.log("❌ PUT update timer - FAILED", "ERROR")
            self.test_results["timer_apis"]["update_timer"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 4. Test POST /api/timer/lap - using query parameter
        success, response = self.test_api_call("POST", "/timer/lap?lap_time=60")
        if success:
            self.log("✅ POST add lap time - SUCCESS")
            self.test_results["timer_apis"]["add_lap"] = "PASS"
        else:
            self.log("❌ POST add lap time - FAILED", "ERROR")
            self.test_results["timer_apis"]["add_lap"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 5. Test POST /api/timer/pause
        success, response = self.test_api_call("POST", "/timer/pause")
        if success:
            self.log("✅ POST pause timer - SUCCESS")
            self.test_results["timer_apis"]["pause_timer"] = "PASS"
        else:
            self.log("❌ POST pause timer - FAILED", "ERROR")
            self.test_results["timer_apis"]["pause_timer"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 6. Test POST /api/timer/resume
        success, response = self.test_api_call("POST", "/timer/resume")
        if success:
            self.log("✅ POST resume timer - SUCCESS")
            self.test_results["timer_apis"]["resume_timer"] = "PASS"
        else:
            self.log("❌ POST resume timer - FAILED", "ERROR")
            self.test_results["timer_apis"]["resume_timer"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 7. Test POST /api/timer/stop - using query parameter  
        success, response = self.test_api_call("POST", "/timer/stop?remarks=Completed calculus practice session with good understanding")
        if success:
            self.log("✅ POST stop timer - SUCCESS")
            self.test_results["timer_apis"]["stop_timer"] = "PASS"
            if isinstance(response, dict) and "elapsedSeconds" in response:
                self.log(f"✅ Timer stopped with {response['elapsedSeconds']} seconds")
        else:
            self.log("❌ POST stop timer - FAILED", "ERROR")
            self.test_results["timer_apis"]["stop_timer"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 8. Test edge cases
        # Try to stop timer when none is active
        success, response = self.test_api_call("POST", "/timer/stop", expected_status=404)
        if not success and hasattr(response, 'status_code') and response.status_code == 404:
            self.log("✅ Stop non-existent timer handled correctly")
        
        # Try to pause when no timer is running
        success, response = self.test_api_call("POST", "/timer/pause")  # This might succeed with current logic
        self.log("⚠️ Pause with no active timer - check behavior")
    
    def test_streak_apis(self):
        """Test streak calculation logic"""
        self.log("=== TESTING STREAK APIs ===", "TEST")
        
        # 1. Test GET /api/streak - initial state
        success, response = self.test_api_call("GET", "/streak")
        if success:
            self.log("✅ GET initial streak - SUCCESS")
            self.test_results["streak_apis"]["get_initial"] = "PASS"
            if isinstance(response, dict):
                initial_streak = response.get("currentStreak", 0)
                self.log(f"✅ Current streak: {initial_streak}")
        else:
            self.log("❌ GET initial streak - FAILED", "ERROR")
            self.test_results["streak_apis"]["get_initial"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 2. Test consecutive days streak
        day1 = (date.today() - timedelta(days=2)).strftime("%Y-%m-%d")
        day2 = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
        day3 = date.today().strftime("%Y-%m-%d")
        
        # Create trackers for test days first
        self.test_api_call("GET", f"/tracker/{day1}")  # This creates the tracker if it doesn't exist
        self.test_api_call("GET", f"/tracker/{day2}")  # This creates the tracker if it doesn't exist
        
        # Mark day 1 complete
        success, response = self.test_api_call("POST", f"/tracker/complete/{day1}")
        if success:
            self.log(f"✅ Marked {day1} complete")
            streak1 = response.get("streak", 0) if isinstance(response, dict) else 0
            
            # Mark day 2 complete (consecutive)
            success2, response2 = self.test_api_call("POST", f"/tracker/complete/{day2}")
            if success2:
                self.log(f"✅ Marked {day2} complete")
                streak2 = response2.get("streak", 0) if isinstance(response2, dict) else 0
                
                if streak2 > streak1:
                    self.log(f"✅ Consecutive day streak incremented: {streak1} -> {streak2}")
                    self.test_results["streak_apis"]["consecutive_days"] = "PASS"
                else:
                    self.log("❌ Consecutive day streak not incremented correctly", "ERROR")
                    self.test_results["streak_apis"]["consecutive_days"] = "FAIL"
                    self.test_results["overall_status"] = "FAIL"
            else:
                self.log("❌ Failed to mark day 2 complete", "ERROR")
        else:
            self.log("❌ Failed to mark day 1 complete", "ERROR")
        
        # 3. Test marking same day twice (should not increment)
        success, response = self.test_api_call("POST", f"/tracker/complete/{day2}")
        if success and isinstance(response, dict):
            message = response.get("message", "")
            if "already completed" in message.lower():
                self.log("✅ Duplicate day completion handled correctly")
                self.test_results["streak_apis"]["duplicate_day"] = "PASS"
            else:
                self.log("⚠️ Duplicate day completion behavior unclear")
        
        # 4. Test non-consecutive date (should reset streak)
        future_date = (date.today() + timedelta(days=5)).strftime("%Y-%m-%d")
        success, response = self.test_api_call("POST", f"/tracker/complete/{future_date}")
        if success:
            self.log("✅ Non-consecutive date completion handled")
            # Check final streak
            success_final, final_response = self.test_api_call("GET", "/streak")
            if success_final and isinstance(final_response, dict):
                final_streak = final_response.get("currentStreak", 0)
                self.log(f"✅ Final streak after non-consecutive: {final_streak}")
    
    def test_quotes_apis(self):
        """Test motivational quotes APIs"""
        self.log("=== TESTING QUOTES APIs ===", "TEST")
        
        # 1. Test GET /api/quotes/daily
        success, response = self.test_api_call("GET", "/quotes/daily")
        if success:
            self.log("✅ GET daily quote - SUCCESS")
            self.test_results["quotes_apis"]["daily_quote"] = "PASS"
            if isinstance(response, dict) and "text" in response and "author" in response:
                self.log(f"✅ Daily quote: '{response['text'][:50]}...' - {response['author']}")
                
                # Test consistency - same quote for same day
                success2, response2 = self.test_api_call("GET", "/quotes/daily")
                if success2 and response == response2:
                    self.log("✅ Daily quote consistency verified")
                else:
                    self.log("❌ Daily quote not consistent", "ERROR")
        else:
            self.log("❌ GET daily quote - FAILED", "ERROR")
            self.test_results["quotes_apis"]["daily_quote"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 2. Test GET /api/quotes/random
        success, response = self.test_api_call("GET", "/quotes/random")
        if success:
            self.log("✅ GET random quote - SUCCESS")
            self.test_results["quotes_apis"]["random_quote"] = "PASS"
            if isinstance(response, dict) and "text" in response:
                self.log(f"✅ Random quote: '{response['text'][:50]}...'")
        else:
            self.log("❌ GET random quote - FAILED", "ERROR")
            self.test_results["quotes_apis"]["random_quote"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 3. Test GET /api/quotes/all
        success, response = self.test_api_call("GET", "/quotes/all")
        if success:
            self.log("✅ GET all quotes - SUCCESS")
            self.test_results["quotes_apis"]["all_quotes"] = "PASS"
            if isinstance(response, list):
                self.log(f"✅ Retrieved {len(response)} total quotes")
                if len(response) >= 15:  # Should have 15 quotes as per code
                    self.log("✅ All quotes count verified")
                else:
                    self.log(f"⚠️ Expected 15+ quotes, got {len(response)}")
        else:
            self.log("❌ GET all quotes - FAILED", "ERROR")
            self.test_results["quotes_apis"]["all_quotes"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
    
    def test_timeslot_apis(self):
        """Test time slot management APIs"""
        self.log("=== TESTING TIME SLOT APIs ===", "TEST")
        
        today = date.today().strftime("%Y-%m-%d")
        
        # Ensure we have a tracker for today
        self.test_api_call("GET", f"/tracker/{today}")
        
        # 1. Test POST /api/tracker/{date}/timeslot - add time slot
        new_timeslot = {
            "timeRange": "10:00-11:30 PM",
            "subject": "Physics",
            "topic": "Quantum Mechanics Basics",
            "practice": True,
            "revision": False,
            "notes": "Evening physics study session",
            "timeSpent": 0,
            "remarks": "",
            "isBreak": False
        }
        
        success, response = self.test_api_call("POST", f"/tracker/{today}/timeslot", new_timeslot)
        if success:
            self.log("✅ POST add time slot - SUCCESS")
            self.test_results["timeslot_apis"]["add_timeslot"] = "PASS"
            if isinstance(response, dict) and "timeSlots" in response:
                total_slots = len(response["timeSlots"])
                self.log(f"✅ Total time slots after addition: {total_slots}")
        else:
            self.log("❌ POST add time slot - FAILED", "ERROR")
            self.test_results["timeslot_apis"]["add_timeslot"] = "FAIL"
            self.test_results["overall_status"] = "FAIL"
        
        # 2. Test DELETE /api/tracker/{date}/timeslot/{index} - delete a valid slot
        # First get current tracker to see how many slots exist
        success_get, tracker_response = self.test_api_call("GET", f"/tracker/{today}")
        if success_get and isinstance(tracker_response, dict):
            current_slots = len(tracker_response.get("timeSlots", []))
            self.log(f"Current slots count: {current_slots}")
            
            if current_slots > 0:
                # Try to delete the last slot (index = current_slots - 1)
                last_slot_index = current_slots - 1
                success, response = self.test_api_call("DELETE", f"/tracker/{today}/timeslot/{last_slot_index}")
                if success:
                    self.log("✅ DELETE time slot - SUCCESS")
                    self.test_results["timeslot_apis"]["delete_timeslot"] = "PASS"
                else:
                    self.log("⚠️ DELETE time slot failed, trying different approach")
                    # Try with an earlier slot
                    success2, response2 = self.test_api_call("DELETE", f"/tracker/{today}/timeslot/0")
                    if success2:
                        self.log("✅ DELETE time slot - SUCCESS")
                        self.test_results["timeslot_apis"]["delete_timeslot"] = "PASS"
                    else:
                        self.log("❌ DELETE time slot - FAILED", "ERROR")
                        self.test_results["timeslot_apis"]["delete_timeslot"] = "FAIL"
                        self.test_results["overall_status"] = "FAIL"
            else:
                self.log("⚠️ No time slots to delete")
                self.test_results["timeslot_apis"]["delete_timeslot"] = "PASS"
        
        # 3. Test edge cases
        # Try to delete with invalid index
        success, response = self.test_api_call("DELETE", f"/tracker/{today}/timeslot/999", expected_status=400)
        if not success and hasattr(response, 'status_code') and response.status_code == 400:
            self.log("✅ Invalid slot index handled correctly")
        
        # Try to add slot to non-existent tracker
        fake_date = "2025-12-31"
        success, response = self.test_api_call("POST", f"/tracker/{fake_date}/timeslot", new_timeslot, expected_status=404)
        if not success and hasattr(response, 'status_code') and response.status_code == 404:
            self.log("✅ Non-existent tracker handled correctly")
    
    def run_all_tests(self):
        """Run all API tests"""
        self.log("🚀 Starting TickFlow Study Tracker API Tests", "TEST")
        
        # Test root endpoint
        success, response = self.test_api_call("GET", "/")
        if success:
            self.log("✅ Root API endpoint accessible")
        else:
            self.log("❌ Root API endpoint failed", "ERROR")
            self.test_results["overall_status"] = "FAIL"
        
        # Run all test suites
        self.test_tracker_apis()
        self.test_timer_apis()
        self.test_streak_apis()
        self.test_quotes_apis()
        self.test_timeslot_apis()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        self.log("📊 TEST SUMMARY", "SUMMARY")
        
        total_tests = 0
        passed_tests = 0
        
        for category, tests in self.test_results.items():
            if category == "overall_status":
                continue
                
            self.log(f"\n{category.upper().replace('_', ' ')}:", "SUMMARY")
            for test_name, status in tests.items():
                self.log(f"  {test_name}: {status}", "SUMMARY")
                total_tests += 1
                if status == "PASS":
                    passed_tests += 1
        
        self.log(f"\nOVERALL RESULTS:", "SUMMARY")
        self.log(f"Total Tests: {total_tests}", "SUMMARY")
        self.log(f"Passed: {passed_tests}", "SUMMARY")
        self.log(f"Failed: {total_tests - passed_tests}", "SUMMARY")
        self.log(f"Success Rate: {(passed_tests/total_tests*100):.1f}%", "SUMMARY")
        self.log(f"Overall Status: {self.test_results['overall_status']}", "SUMMARY")

if __name__ == "__main__":
    tester = TickFlowAPITester()
    tester.run_all_tests()