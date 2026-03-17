# Study Tracker App — Deployment Guide

## Architecture
- **Frontend**: Expo React Native app (deploy via EAS Build)
- **Backend**: FastAPI + MongoDB (deploy via Emergent or any cloud provider)

---

## Step 1: Deploy Backend

### Option A: Deploy on Emergent (Recommended)
1. Click the **Deploy** button on the Emergent platform
2. This deploys your FastAPI backend with MongoDB
3. Your backend URL will be: `https://your-app.emergentagent.com`
4. Cost: 50 credits/month

### Option B: Deploy on Railway/Render/Fly.io
1. Push code to GitHub
2. Connect your repo to Railway/Render
3. Set environment variables: `MONGO_URL`, `DB_NAME`
4. Backend will be available at the provided URL

---

## Step 2: Build Mobile App with Expo EAS

### Prerequisites
1. Install Node.js (v18+) on your local machine
2. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
3. Create a free Expo account at [expo.dev](https://expo.dev)

### Setup
1. Clone the repo to your local machine
2. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   yarn install
   ```
4. Log into Expo:
   ```bash
   eas login
   ```
5. Configure EAS for your project:
   ```bash
   eas build:configure
   ```
   This will update `app.json` with your Expo project ID.

### Update Backend URL
Edit `frontend/.env` and set your deployed backend URL:
```
EXPO_PUBLIC_BACKEND_URL=https://your-deployed-backend-url.com
```

### Build Android APK (for direct install/sharing)
```bash
eas build --platform android --profile preview
```
This creates a downloadable `.apk` file you can install on any Android phone.

### Build Android AAB (for Google Play Store)
```bash
eas build --platform android --profile production
```

### Build iOS (requires Apple Developer Account - $99/year)
```bash
eas build --platform ios --profile production
```

---

## Step 3: Install on Your Phone

### Android
1. After the EAS build completes, you'll get a download link
2. Download the `.apk` file on your Android phone
3. Open the file and install (enable "Install from unknown sources" if prompted)

### iOS
1. For testing: Use TestFlight
2. For distribution: Submit to App Store via `eas submit`

---

## Quick Testing (No Build Needed)
Install **Expo Go** app on your phone and scan the QR code from the Emergent preview to test immediately.

---

## App Configuration

### app.json Key Settings
- `name`: "Study Tracker" (display name)
- `slug`: "study-tracker-app" (URL-safe identifier)
- `ios.bundleIdentifier`: "com.rohitkarna.studytracker"
- `android.package`: "com.rohitkarna.studytracker"
- `version`: "1.0.0"

### Update these before publishing:
1. `owner` in app.json → your Expo username
2. `extra.eas.projectId` → auto-filled by `eas build:configure`
3. Backend URL in `.env`

---

## Created by Rohit Karna
