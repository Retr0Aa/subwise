# Subwise

Subwise is a React app for tracking monthly subscriptions, calculating total spend, and generating AI suggestions to help users cut unnecessary costs.

The project uses Firebase Authentication for login, Firestore for storing subscription data, and a Netlify Function that calls Google Gemini to generate personalized advice.

## Features

- Email/password registration and login
- Google sign-in with Firebase Authentication
- Protected account page for logged-in users
- Add and remove subscriptions with monthly prices
- Automatic monthly total calculation
- Firestore persistence per user
- AI-generated subscription advice powered by Gemini
- Netlify-ready deployment setup

## Tech Stack

- React 19
- Vite
- React Router
- React Bootstrap
- Firebase Authentication
- Cloud Firestore
- Netlify Functions
- Google Generative AI SDK

## How It Works

After a user signs in, Subwise loads their subscriptions from Firestore and shows the current monthly total. When the user clicks `Get AI Advice`, the frontend sends the subscription list to the Netlify function at `/.netlify/functions/generate`. That function calls Gemini and stores the latest AI response back in Firestore so it can be shown again later.

## Project Structure

```text
src/
  pages/
    Home.jsx
    Login.jsx
    Register.jsx
    Account.jsx
  config/firebase.js
  AuthContext.jsx
  App.jsx
netlify/
  functions/
    generate.js
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Create your Firebase project and enable:

- Authentication
- Email/Password sign-in
- Google sign-in
- Cloud Firestore

Then update [`src/config/firebase.js`](/Users/alexanderbuchkov/Desktop/Programming/subwise/src/config/firebase.js) with your Firebase project credentials.

### 3. Configure environment variables

Create a local `.env` file with:

```env
GEMINI_API_KEY=your_gemini_api_key
```

This key is used by the Netlify serverless function in [`netlify/functions/generate.js`](/Users/alexanderbuchkov/Desktop/Programming/subwise/netlify/functions/generate.js).

### 4. Run the project

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
  "subscriptions": {
    "Netflix": 12.99,
    "Spotify": 5.99
  },
  "latestResponse": "You may want to cancel one of the overlapping streaming services..."
}
```

## Deployment

This project includes [`netlify.toml`](/Users/alexanderbuchkov/Desktop/Programming/subwise/netlify.toml) for deployment on Netlify.

- `dist` is used as the publish directory
- `netlify/functions` is used for serverless functions
- a SPA redirect sends all routes to `index.html`

When deploying, add `GEMINI_API_KEY` in your Netlify environment variables.

## Notes

- Firebase config is currently stored directly in the frontend config file. For production, consider moving client configuration to Vite environment variables for easier environment management.
- The Gemini API key should never be committed to version control.
- `.env` is not currently ignored by this repository, so adding it to `.gitignore` would be a good next step.

## Future Improvements

- Edit existing subscriptions
- Support yearly billing and billing dates
- Add charts and spending history
- Categorize subscriptions by type
- Improve prompt design for more useful AI advice

## License

This project is for personal/portfolio use unless you choose to add a license.
