# 🔥 Habit Streak Timer

A lightweight study tracking app with local data storage. No backend needed—everything runs in your browser!

## Features

✅ **Zero Backend** - All data saved locally using AsyncStorage  
✅ **Offline First** - Works perfectly without internet  
✅ **Streak Tracking** - Track your study consistency  
✅ **Daily Reflections** - Log your progress daily  
✅ **Mobile Responsive** - Works on all devices  
✅ **Instant Deployment** - Deploy to Vercel in seconds  

## Quick Start

### Local Development

```bash
cd frontend
yarn install
yarn web
```

Open http://localhost:8081 in your browser.

### Deploy to Vercel

**One-click deploy:**
1. Push to GitHub
2. Go to vercel.com → "New Project"
3. Select your repo
4. Click "Deploy"

**Or use CLI:**
```bash
yarn global add vercel
vercel
```

Your app will be live instantly!

## Tech Stack

- **Framework:** Expo React Native (web)
- **Storage:** AsyncStorage (browser localStorage)
- **Styling:** React Native StyleSheet
- **Deployment:** Vercel

## Data Storage

All your study data is stored **locally in your browser**:
- 📱 Works offline
- 🔒 No data sent to servers
- ⚡ Ultra-fast access
- 💾 Persists across sessions

## Features

### Study Tracking
- Add multiple study sessions per day
- Track subjects and topics
- Log time spent on each session
- Mark sessions as practice/revision

### Daily Streaks
- Automatic streak counting
- Streak broken if you miss a day
- Visual streak counter

### Daily Reflection
- Log successful topics
- Note difficult areas
- Plan tomorrow's study
- Self-rating system

### Mood Tracking
- 5 mood levels (😫 to 🤩)
- Track energy levels throughout the week

## No Environment Variables Needed!

This app runs completely client-side. No API keys, no backend configuration needed.

## File Structure

```
frontend/
├── app/
│   ├── index.tsx         # Main app screen
│   ├── calendar.tsx      # Calendar view
│   ├── timer.tsx         # Timer screen
│   ├── quotes.tsx        # Motivational quotes
│   └── _layout.tsx       # Navigation layout
├── components/           # Reusable components
├── services/
│   └── storageService.ts # Local storage operations
├── store/
│   └── timerStore.ts     # Zustand state management
└── assets/               # Images & icons
```

## Commands

| Command | Purpose |
|---------|---------|
| `yarn web` | Dev server (localhost:8081) |
| `yarn expo export --platform web` | Build for production |
| `yarn lint` | Run ESLint |
| `yarn start` | Run with Expo CLI |

## How It Works

1. **Add Study Sessions** - Log what you studied
2. **Track Time** - Built-in timer for each session
3. **Daily Reflection** - Review your day and progress
4. **Mark Complete** - Increment your streak
5. **Stay Consistent** - Maintain your streak!

## Browser Support

Works in all modern browsers:
- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Mobile browsers ✅

## Troubleshooting

**"Data not saving?"**
- Check browser storage is enabled
- Open DevTools → Application → LocalStorage

**"Offline?"**
- The app works 100% offline after first load
- All data stored locally

**"Lost data?"**
- Clear browser cache carefully - it will delete saved data
- Consider exporting your data regularly

## Privacy

✅ No data leaves your device  
✅ No tracking  
✅ No analytics  
✅ Completely private  

## Contributing

Found a bug? Have an idea? Open an issue or submit a PR!

## License

MIT - Feel free to use and modify

---

Built with ❤️ | Powered by Expo + Vercel

