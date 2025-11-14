# Virtual AI Assistant

Production-ready React + TypeScript + Tailwind + Vite project with chat and voice I/O, PDF summarizer, reminders, notifications, and profile management.

## Getting started

> **Prerequisites:** Install [Node.js](https://nodejs.org/en/) before running the commands below.

Install dependencies:

```
npm install
```

Start the dev server (frontend):

```
npm run dev
```

The app will be available at [http://localhost:5173/](http://localhost:5173/).

Start the Express backend in a second terminal so chat/voice requests can proxy through Groq securely:

```
npm run server
```

The backend listens on [http://localhost:3000](http://localhost:3000) by default.

When you're ready to produce an optimized build:

```
npm run build
```

## Environment variables

Create a `.env` file in `virtual-ai-assistant/` that contains at least:

```
GROQ_API_KEY=sk_your_actual_key
# Optional: override the frontend proxy URL
# VITE_API_BASE_URL=http://localhost:3000
```

- `GROQ_API_KEY` is read by the Express backend via `dotenv`. Keep it private and never prefix it with `VITE_`.
- `VITE_API_BASE_URL` allows the frontend to call a different proxy URL (defaults to `http://localhost:3000`).

Example (PowerShell) for a temporary session:

```
$env:GROQ_API_KEY = "sk_your_actual_key"
npm run server
```

## Voice in Chat

- Click the mic to start recording; the waveform animates while listening and auto-stops on silence.
- The assistant posts the transcription, fetches a Groq response, and reads it back with speech synthesis.
- Use the stop button to cancel listening, speaking, and any in-flight Groq request immediately.
