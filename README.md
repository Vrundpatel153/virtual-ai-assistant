# Virtual AI Assistant

Production-ready React + TypeScript + Tailwind + Vite project with Chat and voice I/O, PDF summarizer, reminders, notifications, and profile management.

## Getting started

> **Prerequisites:**
> The following steps require [NodeJS](https://nodejs.org/en/) to be installed on your system, so please
> install it beforehand if you haven't already.

To get started with your project, you'll first need to install the dependencies with:

```
npm install
```

Then, you'll be able to run a development version of the project with:

```
npm run dev
```

After a few seconds, your project should be accessible at the address
[http://localhost:5173/](http://localhost:5173/)


If you are satisfied with the result, you can finally build the project for release with:

```
npm run build

## Environment variables

The app can use either a key saved in Settings (in-app) or a Gemini key from your environment. If any key is present, token limits are bypassed and all AI calls use Gemini with web grounding when available.

1) Quick temporary setup (Windows PowerShell):

```
$env:VITE_GEMINI_API_KEY = "your_key_here"
npm run dev
```

2) Recommended for local dev: copy `.env.example` to `.env` and fill in your key:

```
cp .env.example .env
# then edit .env and add your key
```

Notes:
- This is a client app; VITE_* env vars are exposed to the browser. For production, proxy AI calls through a backend to keep secrets server-side.
- You can also paste an API key in Settings; the app will prefer the Settings key if present.

## Voice in Chat

- Click the mic to start; waveform shows while listening. Auto-stops on silence, posts your question, then reads the AI answer aloud.
- Stop button cancels listening, speaking, and in-flight AI requests cleanly.
```
