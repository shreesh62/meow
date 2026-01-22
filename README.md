# Meow Mood Tracker

A private, couple-only mood tracking app built with React, Tailwind CSS, and Supabase.

## Features
- **Private Spaces**: Invite-only space for you and your partner.
- **Real-time Mood Sync**: Instantly see when your partner updates their mood.
- **History & QnA**: Track moods over time and answer daily questions (coming soon).
- **PWA Ready**: Installable on mobile.

## Setup Instructions

### 1. Supabase Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `SUPABASE_SETUP.sql` from this project and run it.
4. Go to **Project Settings > API**.
5. Copy the **Project URL** and **anon public key**.

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run Locally
```bash
npm install
npm run dev
```

## How to Use
1. **User A**: Opens the app, clicks "Create Space", enters their name.
2. **User A**: Copies the "Space Code" from the dashboard (top left).
3. **User B**: Opens the app, clicks "Join Space", enters name and the Code.
4. Both users can now update their mood and see changes in real-time!

## Deployment
Build for production:
```bash
npm run build
```
Deploy the `dist` folder to Vercel, Netlify, or any static host.
