# Build Private Couple Mood Tracker (PWA)

I will build a React + Vite + Tailwind CSS application with a clean, API-driven structure suitable for future Android wrapping. The backend will use Supabase for real-time data sync.

## Technical Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide React (Icons), `date-fns` (Date management).
- **Backend/Data**: Supabase (PostgreSQL + Realtime).
- **State Management**: React Context + Custom Hooks (for clean separation).
- **Routing**: React Router DOM.

## 1. Project Initialization & Structure
- Initialize React project with Vite.
- Configure Tailwind CSS with a "Pastel" color palette extension.
- Create folder structure:
  - `src/services`: API calls (Supabase wrapper).
  - `src/hooks`: Data logic hooks (`useMood`, `useSpace`).
  - `src/components`: Reusable UI (Cards, Buttons).
  - `src/pages`: Screens (Join, Dashboard, History, QnA).
  - `src/context`: Global state (User/Space session).

## 2. Data Layer & Schema (Supabase)
I will provide the SQL schema to run in your Supabase SQL Editor.
- **Tables**:
  - `spaces`: Stores the unique invite code and pair status.
  - `users`: Linked to a space (max 2 per space).
  - `moods`: Stores current and history of moods.
  - `qna`: Stores daily questions and answers.
- **Real-time**:
  - Enable Realtime on `moods` and `spaces` tables to trigger instant UI updates.

## 3. Core Features Implementation
### Phase 1: Onboarding (Space Logic)
- **Create Space**: Generate a 6-digit code, create a user ID, save to local storage.
- **Join Space**: Enter code, validate space exists & has room, create user ID, save to local storage.

### Phase 2: Mood Tracker (Dashboard)
- **Mood Input**: Simple UI to select Emoji + Color + Label.
- **Live Display**: Listen to changes in `moods` table. Show "My Mood" and "Partner's Mood".
- **Sync**: Optimistic UI updates with background Supabase writes.

### Phase 3: History & QnA
- **Calendar**: Visual grid of past moods (emoji per day).
- **QnA Tab**: Simple MCQ interface. "Waiting for partner" state hiding answers until both reply.

## 4. PWA & Mobile Polish
- Add `manifest.json` for "Add to Home Screen".
- Ensure touch-friendly UI (large touch targets).
- Disable zooming/text selection for app-like feel.

## 5. Android Wrapper Prep
- Ensure all API calls are centralized so the native wrapper can eventually hook into the same data sources or webview events.
