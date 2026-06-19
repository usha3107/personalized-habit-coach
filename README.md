# Personalized Habit Coach

A smart habit-tracking mobile application built with **React Native** and **Expo**. It personalizes reminder notifications by learning from user behavior, using an on-device prediction algorithm (mean and standard deviation) to nudge users at their optimal time window. It features SQLite local persistence, custom calendar heatmaps, and social proof stats fetched from a serverless Hono backend.

---

## 🚀 Getting Started & VS Code Commands

Open your VS Code terminal and execute the following commands to run the application components:

### 1. Run Hono Backend Service
Navigate to the `backend` folder, install dependencies, and start the development server:
```bash
cd backend
npm install
npm run dev
```
*The Hono API will start running locally at `http://localhost:3000`.*

### 2. Run Algorithm Unit Tests
Open a new terminal tab at the project root and execute the TypeScript test suite:
```bash
npx tsx tests/algorithm.test.ts
```
*This verifies the optimal window calculations across cold start and standard scenarios.*

### 3. Run React Native App (Expo Client)
In your root terminal tab, install client dependencies with legacy peer resolution and launch the Metro bundler:
```bash
# In the repository root:
npm install --legacy-peer-deps
npm start
```
- Press **`w`** to open in web browser.
- Press **`a`** to open in Android Emulator.
- Press **`i`** to open in iOS Simulator.

---

## 🛠️ Technology Stack
- **Frontend Mobile**: React Native, Expo, Expo Router
- **Data Persistence**: SQLite (via `expo-sqlite`)
- **Push Reminders**: Dynamic on-device scheduling (via `expo-notifications`)
- **Backend Edge API**: Hono Framework
- **Schema Validation**: Zod
- **Unit Testing**: tsx, custom lightweight assertion suites

---

## 📂 Project Structure
- `/components`: Custom elements like `StreakCalendar` (calendar heatmap), `AddHabitModal`, `AnalyticsModal` (charts and community stats), and `DebuggerPanel` (diagnostics).
- `/context`: global state hook using React Reducer syncing SQLite operations and notifications rescheduling.
- `/lib`: Helper modules for local database access (`storage.ts`), reminder setup (`notifications.ts`), analytics (`streak.ts`), and the nudge logic (`algorithm.ts`).
- `/tests`: Assertion suites for testing prediction behaviors.
- `ALGORITHM.md`: Explains standard deviation calculations, clamping boundaries, and timezone offsets.
