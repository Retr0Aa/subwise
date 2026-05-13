# Subwise

Subwise is a React app for tracking monthly expenses, calculating total spend, and generating AI suggestions to help users cut unnecessary costs.

The project uses Firebase Authentication for login, Firestore for storing expense data, and a Netlify Function that calls Google Gemini to generate personalized advice.

## Features

- Email/password registration and login
- Google sign-in with Firebase Authentication
- Protected account page for logged-in users
- Add and remove expenses with monthly prices
- Automatic monthly total calculation
- Firestore persistence per user
- AI-generated expenses advice powered by Gemini
- Netlify-ready deployment setup

## Tech Stack

- React 19
- Vite
- React Router
- React Bootstrap
- Firebase Authentication
- Cloud Firestore
- Netlify Functions

## How It Works

After a user signs in, Subwise loads their expenses from Firestore and shows the current monthly total. When the user clicks `Get AI Advice`, the frontend sends the expenses list to the Netlify function at `/.netlify/functions/generate`. That function calls Gemini and stores the latest AI response back in Firestore so it can be shown again later.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a local `.env` file with:

```env
GEMINI_API_KEY=your_gemini_api_key
```

This key is used by the Netlify serverless function in [`netlify/functions/generate.js`](/Users/alexanderbuchkov/Desktop/Programming/subwise/netlify/functions/generate.js).

### 3. Run the project

For frontend-only development:

```bash
npm run dev
```

For full local development with the Netlify function available, run the app through Netlify Dev:

```bash
npx netlify dev
```

Use `netlify dev` when you want the `Get AI Advice` button to work locally, because the app calls `/.netlify/functions/generate`.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Firestore Data Shape

Each user document is stored under:

```text
users/{uid}
```

Example document:

```json
{
  "expenses": {
    "Netflix": 12.99,
    "Spotify": 5.99
  },
  "latestResponse": "You may want to cancel one of the overlapping streaming services..."
}
```
