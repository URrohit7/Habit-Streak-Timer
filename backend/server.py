from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date
from bson import ObjectId
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Pydantic Models
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class TimeSlot(BaseModel):
    timeRange: str
    subject: str = ""
    topic: str = ""
    practice: bool = False
    revision: bool = False
    notes: str = ""
    timeSpent: int = 0  # seconds
    remarks: str = ""
    isBreak: bool = False

class DailyReflection(BaseModel):
    revisionsCompleted: str = ""
    topicsToRevise: str = ""
    nextDayPlan: str = ""
    weakAreas: str = ""
    syllabusCovered: str = ""
    productivity: int = 0  # 1-10

class DailyTracker(BaseModel):
    date: str  # YYYY-MM-DD format
    day: str = ""
    totalStudyHours: dict = {"hrs": 0, "min": 0}
    mood: int = 3  # 1-5
    timeSlots: List[TimeSlot] = []
    dailyReflection: DailyReflection = DailyReflection()
    isCompleted: bool = False
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class DailyTrackerResponse(DailyTracker):
    id: str

class ActiveTimer(BaseModel):
    date: str
    timeSlotIndex: int
    timerName: str
    startTime: datetime
    elapsedSeconds: int = 0
    isRunning: bool = True
    lapTimes: List[int] = []

class StreakData(BaseModel):
    currentStreak: int = 0
    longestStreak: int = 0
    lastCompletedDate: Optional[str] = None
    completedDates: List[str] = []

class Quote(BaseModel):
    text: str
    author: str
    category: str

# Default time slots based on PDF
DEFAULT_TIME_SLOTS = [
    {"timeRange": "9:00-10:30 AM", "isBreak": False},
    {"timeRange": "10:30-10:45 AM", "isBreak": True, "subject": "Short Break"},
    {"timeRange": "10:45 AM-12:15 PM", "isBreak": False},
    {"timeRange": "12:15-1:00 PM", "isBreak": True, "subject": "Lunch Break"},
    {"timeRange": "1:00-2:30 PM", "isBreak": False},
    {"timeRange": "2:30-2:45 PM", "isBreak": True, "subject": "Short Break"},
    {"timeRange": "2:45-4:15 PM", "isBreak": False},
    {"timeRange": "4:15-4:30 PM", "isBreak": True, "subject": "Short Break"},
    {"timeRange": "4:30-6:00 PM", "isBreak": False},
    {"timeRange": "6:00-7:00 PM", "isBreak": True, "subject": "Dinner Break"},
    {"timeRange": "7:00-8:30 PM", "isBreak": False},
    {"timeRange": "8:30-10:00 PM", "isBreak": False},
]

# Motivational Quotes Database
MOTIVATIONAL_QUOTES = [
    {"text": "Success is the sum of small efforts repeated day in and day out.", "author": "Robert Collier", "category": "consistency"},
    {"text": "The expert in anything was once a beginner.", "author": "Helen Hayes", "category": "motivation"},
    {"text": "Don't watch the clock; do what it does. Keep going.", "author": "Sam Levenson", "category": "focus"},
    {"text": "Study while others are sleeping; work while others are loafing; prepare while others are playing.", "author": "William Arthur Ward", "category": "dedication"},
    {"text": "The beautiful thing about learning is that no one can take it away from you.", "author": "B.B. King", "category": "learning"},
    {"text": "Education is not preparation for life; education is life itself.", "author": "John Dewey", "category": "learning"},
    {"text": "The only way to do great work is to love what you do.", "author": "Steve Jobs", "category": "passion"},
    {"text": "Your future is created by what you do today, not tomorrow.", "author": "Robert Kiyosaki", "category": "action"},
    {"text": "Small progress is still progress. Keep going!", "author": "Unknown", "category": "motivation"},
    {"text": "Focus on being productive instead of busy.", "author": "Tim Ferriss", "category": "productivity"},
    {"text": "The harder you work for something, the greater you'll feel when you achieve it.", "author": "Unknown", "category": "achievement"},
    {"text": "Don't stop when you're tired. Stop when you're done.", "author": "Unknown", "category": "perseverance"},
    {"text": "Strive for progress, not perfection.", "author": "Unknown", "category": "growth"},
    {"text": "Dream big, work hard, stay focused, and surround yourself with good people.", "author": "Unknown", "category": "success"},
    {"text": "You don't have to be great to start, but you have to start to be great.", "author": "Zig Ziglar", "category": "beginning"},
]

# Helper function to convert ObjectId to string
def tracker_helper(tracker) -> dict:
    return {
        "id": str(tracker["_id"]),
        "date": tracker["date"],
        "day": tracker.get("day", ""),
        "totalStudyHours": tracker.get("totalStudyHours", {"hrs": 0, "min": 0}),
        "mood": tracker.get("mood", 3),
        "timeSlots": tracker.get("timeSlots", []),
        "dailyReflection": tracker.get("dailyReflection", {}),
        "isCompleted": tracker.get("isCompleted", False),
        "createdAt": tracker.get("createdAt"),
        "updatedAt": tracker.get("updatedAt"),
    }

# Routes
@api_router.get("/")
async def root():
    return {"message": "TickFlow Study Tracker API"}

# Tracker Routes
@api_router.get("/tracker/{date_str}")
async def get_tracker(date_str: str):
    """Get tracker for specific date (YYYY-MM-DD format)"""
    tracker = await db.trackers.find_one({"date": date_str})
    
    if not tracker:
        # Create default tracker for this date
        new_tracker = {
            "date": date_str,
            "day": "",
            "totalStudyHours": {"hrs": 0, "min": 0},
            "mood": 3,
            "timeSlots": [TimeSlot(**slot).dict() for slot in DEFAULT_TIME_SLOTS],
            "dailyReflection": DailyReflection().dict(),
            "isCompleted": False,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        result = await db.trackers.insert_one(new_tracker)
        new_tracker["_id"] = result.inserted_id
        return tracker_helper(new_tracker)
    
    return tracker_helper(tracker)

@api_router.post("/tracker")
async def create_or_update_tracker(tracker: DailyTracker):
    """Create or update a tracker"""
    tracker_dict = tracker.dict()
    tracker_dict["updatedAt"] = datetime.utcnow()
    
    existing = await db.trackers.find_one({"date": tracker.date})
    
    if existing:
        # Update existing
        await db.trackers.update_one(
            {"date": tracker.date},
            {"$set": tracker_dict}
        )
        updated = await db.trackers.find_one({"date": tracker.date})
        return tracker_helper(updated)
    else:
        # Create new
        tracker_dict["createdAt"] = datetime.utcnow()
        result = await db.trackers.insert_one(tracker_dict)
        tracker_dict["_id"] = result.inserted_id
        return tracker_helper(tracker_dict)

@api_router.post("/tracker/complete/{date_str}")
async def mark_day_complete(date_str: str):
    """Mark a day as complete and update streak"""
    # Mark tracker as completed
    tracker = await db.trackers.find_one({"date": date_str})
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker not found")
    
    await db.trackers.update_one(
        {"date": date_str},
        {"$set": {"isCompleted": True, "updatedAt": datetime.utcnow()}}
    )
    
    # Update streak
    streak_data = await db.streaks.find_one()
    
    if not streak_data:
        # Initialize streak
        new_streak = 1
        streak_data = {
            "currentStreak": new_streak,
            "longestStreak": new_streak,
            "lastCompletedDate": date_str,
            "completedDates": [date_str]
        }
        await db.streaks.insert_one(streak_data)
    else:
        # Check if already completed
        if date_str in streak_data.get("completedDates", []):
            return {"message": "Day already completed", "streak": streak_data.get("currentStreak", 0)}
        
        # Calculate streak
        from datetime import timedelta
        from datetime import datetime as dt_parser
        last_date = dt_parser.strptime(streak_data.get("lastCompletedDate", date_str), "%Y-%m-%d")
        current_date = dt_parser.strptime(date_str, "%Y-%m-%d")
        
        day_diff = (current_date - last_date).days
        
        if day_diff == 1:
            # Consecutive day
            new_streak = streak_data.get("currentStreak", 0) + 1
        else:
            # Streak broken or future date
            new_streak = 1
        
        longest_streak = max(streak_data.get("longestStreak", 0), new_streak)
        completed_dates = streak_data.get("completedDates", [])
        completed_dates.append(date_str)
        
        await db.streaks.update_one(
            {"_id": streak_data["_id"]},
            {"$set": {
                "currentStreak": new_streak,
                "longestStreak": longest_streak,
                "lastCompletedDate": date_str,
                "completedDates": completed_dates
            }}
        )
    
    return {"message": "Day marked complete!", "streak": new_streak}

@api_router.get("/tracker/recent/list")
async def get_recent_trackers():
    """Get recent 30 days of trackers"""
    trackers = await db.trackers.find().sort("date", -1).limit(30).to_list(30)
    return [tracker_helper(t) for t in trackers]

# Timer Routes
@api_router.get("/timer/active")
async def get_active_timer():
    """Get currently active timer"""
    timer = await db.active_timers.find_one({"isRunning": True})
    if not timer:
        return None
    return {
        "id": str(timer["_id"]),
        "date": timer["date"],
        "timeSlotIndex": timer["timeSlotIndex"],
        "timerName": timer["timerName"],
        "startTime": timer["startTime"].isoformat(),
        "elapsedSeconds": timer["elapsedSeconds"],
        "isRunning": timer["isRunning"],
        "lapTimes": timer.get("lapTimes", [])
    }

@api_router.post("/timer/start")
async def start_timer(timer: ActiveTimer):
    """Start a new timer"""
    # Stop any existing active timer
    await db.active_timers.update_many(
        {"isRunning": True},
        {"$set": {"isRunning": False}}
    )
    
    # Create new timer
    timer_dict = timer.dict()
    result = await db.active_timers.insert_one(timer_dict)
    timer_dict["_id"] = result.inserted_id
    
    # Remove ObjectId from dict and return safe response
    safe_timer_dict = {k: v for k, v in timer_dict.items() if k != "_id"}
    return {
        "id": str(result.inserted_id),
        "message": "Timer started",
        **safe_timer_dict
    }

@api_router.post("/timer/stop")
async def stop_timer(remarks: Optional[str] = ""):
    """Stop active timer and save time to tracker"""
    timer = await db.active_timers.find_one({"isRunning": True})
    
    if not timer:
        raise HTTPException(status_code=404, detail="No active timer found")
    
    # Mark timer as stopped
    await db.active_timers.update_one(
        {"_id": timer["_id"]},
        {"$set": {"isRunning": False}}
    )
    
    # Update tracker with elapsed time and remarks
    tracker = await db.trackers.find_one({"date": timer["date"]})
    if tracker:
        time_slots = tracker.get("timeSlots", [])
        if 0 <= timer["timeSlotIndex"] < len(time_slots):
            time_slots[timer["timeSlotIndex"]]["timeSpent"] = timer["elapsedSeconds"]
            time_slots[timer["timeSlotIndex"]]["remarks"] = remarks
            
            await db.trackers.update_one(
                {"date": timer["date"]},
                {"$set": {"timeSlots": time_slots, "updatedAt": datetime.utcnow()}}
            )
    
    return {"message": "Timer stopped and saved", "elapsedSeconds": timer["elapsedSeconds"]}

@api_router.put("/timer/update")
async def update_timer(elapsed_seconds: int):
    """Update elapsed time for active timer"""
    result = await db.active_timers.update_one(
        {"isRunning": True},
        {"$set": {"elapsedSeconds": elapsed_seconds}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="No active timer found")
    
    return {"message": "Timer updated"}

@api_router.post("/timer/pause")
async def pause_timer():
    """Pause active timer"""
    await db.active_timers.update_one(
        {"isRunning": True},
        {"$set": {"isRunning": False}}
    )
    return {"message": "Timer paused"}

@api_router.post("/timer/resume")
async def resume_timer():
    """Resume paused timer"""
    timer = await db.active_timers.find_one({"isRunning": False})
    if not timer:
        raise HTTPException(status_code=404, detail="No paused timer found")
    
    await db.active_timers.update_one(
        {"_id": timer["_id"]},
        {"$set": {"isRunning": True, "startTime": datetime.utcnow()}}
    )
    return {"message": "Timer resumed"}

@api_router.post("/timer/lap")
async def add_lap(lap_time: int):
    """Add lap time to active timer"""
    timer = await db.active_timers.find_one({"isRunning": True})
    if not timer:
        raise HTTPException(status_code=404, detail="No active timer found")
    
    lap_times = timer.get("lapTimes", [])
    lap_times.append(lap_time)
    
    await db.active_timers.update_one(
        {"_id": timer["_id"]},
        {"$set": {"lapTimes": lap_times}}
    )
    return {"message": "Lap recorded", "lapTimes": lap_times}

# Streak Routes
@api_router.get("/streak")
async def get_streak():
    """Get current streak data"""
    streak = await db.streaks.find_one()
    if not streak:
        return {
            "currentStreak": 0,
            "longestStreak": 0,
            "lastCompletedDate": None,
            "completedDates": []
        }
    return {
        "currentStreak": streak.get("currentStreak", 0),
        "longestStreak": streak.get("longestStreak", 0),
        "lastCompletedDate": streak.get("lastCompletedDate"),
        "completedDates": streak.get("completedDates", [])
    }

# Quote Routes
@api_router.get("/quotes/daily")
async def get_daily_quote():
    """Get daily motivational quote"""
    # Use current date as seed for consistent daily quote
    today = datetime.utcnow().date()
    seed = int(today.strftime("%Y%m%d"))
    random.seed(seed)
    quote = random.choice(MOTIVATIONAL_QUOTES)
    return quote

@api_router.get("/quotes/random")
async def get_random_quote():
    """Get random motivational quote"""
    return random.choice(MOTIVATIONAL_QUOTES)

@api_router.get("/quotes/all")
async def get_all_quotes():
    """Get all motivational quotes"""
    return MOTIVATIONAL_QUOTES

# Add time slot to tracker
@api_router.post("/tracker/{date_str}/timeslot")
async def add_time_slot(date_str: str, time_slot: TimeSlot):
    """Add a new time slot to tracker"""
    tracker = await db.trackers.find_one({"date": date_str})
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker not found")
    
    time_slots = tracker.get("timeSlots", [])
    time_slots.append(time_slot.dict())
    
    await db.trackers.update_one(
        {"date": date_str},
        {"$set": {"timeSlots": time_slots, "updatedAt": datetime.utcnow()}}
    )
    
    return {"message": "Time slot added", "timeSlots": time_slots}

@api_router.delete("/tracker/{date_str}/timeslot/{slot_index}")
async def delete_time_slot(date_str: str, slot_index: int):
    """Delete a time slot from tracker"""
    tracker = await db.trackers.find_one({"date": date_str})
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker not found")
    
    time_slots = tracker.get("timeSlots", [])
    if 0 <= slot_index < len(time_slots):
        time_slots.pop(slot_index)
        
        await db.trackers.update_one(
            {"date": date_str},
            {"$set": {"timeSlots": time_slots, "updatedAt": datetime.utcnow()}}
        )
        return {"message": "Time slot deleted"}
    
    raise HTTPException(status_code=400, detail="Invalid slot index")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
