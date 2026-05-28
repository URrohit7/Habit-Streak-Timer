# Habit Streak Timer — Quick Start (Frontend Only)

**No backend setup needed!** This app runs entirely on your device with local storage.

## Install & Run (1 minute)

### Step 1: Install Dependencies
```bash
cd frontend
yarn install
```

### Step 2: Run the App

**For Web (easiest):**
```bash
yarn web
```
Opens automatically at `http://localhost:8081`

**For iOS (requires Mac):**
```bash
yarn ios
```

**For Android (requires Android Studio):**
```bash
yarn android
```

Done! The app is ready to use.

---

## How It Works

- ✅ **Habits stored locally** — Uses AsyncStorage (on-device database)
- ✅ **No internet required** — Works completely offline
- ✅ **All data on your device** — Nothing sent anywhere
- ✅ **Instant startup** — No backend delays
- ⚠️ **Data only on this device** — Not synced across devices (yet)

---

## Features

- Create and track daily habits
- View habit streaks
- Mark habits complete/incomplete
- Calendar view of progress
- Local notifications (optional)

---

## Want to Add Backend Later?

If you want to sync data across devices:

1. Deploy backend to Railway/Render (see DEPLOYMENT_GUIDE.md)
2. Update `frontend/.env`:
   ```
   EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
   ```
3. Code already supports backend—just configure the URL!

---

## Troubleshooting

**"Port already in use"**
```bash
# Kill process on port 8081
# Mac/Linux:
lsof -ti:8081 | xargs kill -9

# Windows:
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

**"Module not found"**
```bash
rm -rf node_modules
yarn install
```

**"Expo not installed"**
```bash
npm install -g expo-cli
yarn web
```

---

## Build for Release

**Android APK** (for friends to download):
```bash
cd frontend
eas build --platform android --local
```

**iOS** (requires Apple Developer account):
```bash
eas build --platform ios
```

---

## Next Steps

- Customize app name in `frontend/app.json`
- Add your own habit categories
- Deploy to app stores when ready
- Add backend sync (see DEPLOYMENT_GUIDE.md)

Happy tracking! 🎯
