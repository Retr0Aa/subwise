# Subwise

Subwise is a React app for tracking monthly expenses, calculating total spend, and generating AI suggestions to help users cut unnecessary costs.

The project uses Firebase Authentication for login, Firestore for storing expense data, and WebLLM to run TinyLlama directly in the browser for private local advice.

## Features

- Email/password registration and login
- Google sign-in with Firebase Authentication
- Protected account page for logged-in users
- Add and remove expenses with monthly prices
- Automatic monthly total calculation
- Firestore persistence per user
- AI-generated expenses advice powered by TinyLlama in the browser
- No AI server or API key required

## Tech Stack

- React 19
- Vite
- React Router
- React Bootstrap
- Firebase Authentication
- Cloud Firestore
- WebLLM

## How It Works

After a user signs in, Subwise loads their expenses from Firestore and shows the current monthly total. When the user clicks `Get AI Advice`, the app loads TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k in a Web Worker, streams progress into the UI, and sends the full expenses list to the local model. The latest response is stored back in Firestore so it can be shown again later.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the project

For frontend-only development:

```bash
npm run dev
```

The AI button now runs locally in the browser, so `npm run dev` is enough. The first run may take a while because the TinyLlama model must download before it can answer.

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
