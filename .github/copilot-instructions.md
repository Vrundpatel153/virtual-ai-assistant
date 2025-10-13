This project is a small React + Vite UI built with Tailwind and components inspired by shadcn/ui.

Key points an AI coding agent should know to be productive immediately:

- Project layout
  - `index.html` is the entry; the React root mounts at the element with id `app`.
  - Routes are defined in `src/index.tsx` using `react-router-dom`. Screens live under `src/screens/*` (e.g. `Chat`, `Voice`, `Agents`, `Settings`, `Profile`, `Template`).
  - Shared UI components are in `src/components/` and `src/components/ui/` (small primitives). Utility helpers are in `src/lib/` (e.g. `cn` in `src/lib/utils.ts`).

- Build & dev commands (from `package.json`)
  - Install: `npm install`
  - Run dev server: `npm run dev` (Vite, default port 5173 unless overridden)
  - Build production bundle: `npm run build`
  - Preview production build: `npm run preview`
  - Note: `vite.config.ts` sets the dev server port to `8080` and base to `./`.

- Styling & design system
  - Tailwind is configured in `tailwind.config.js`. The project relies on CSS variables for theme tokens (see `theme.extend.colors` and `darkMode: ['class']`).
  - The class concatenation helper `cn` in `src/lib/utils.ts` uses `clsx` + `tailwind-merge` — reuse it for conditional classnames.

- Component & state patterns
  - Components are mostly functional React + TypeScript. Props are explicit interfaces (see `Modal.tsx`).
  - Keep effects idempotent: e.g., `Modal` manipulates `document.body.style.overflow` and adds/removes escape-key listeners — follow the same cleanup pattern when editing modal-like behavior.
  - Local UI state is used for demo flows (see `Chat.tsx` which keeps messages in component state and simulates an AI response with `setTimeout`). If integrating a real AI API, replace the simulated response but preserve the message object shape:
    - Message shape example: { id: string, text: string, sender: 'user'|'ai', timestamp: Date }

- Patterns for adding features
  - Add new screens under `src/screens/<Name>/<Name>.tsx` and export them from the file. Register routes in `src/index.tsx`.
  - Keep styles using Tailwind utility classes and the existing gradient/rounded/shadow patterns for visual consistency.
  - Use the `Navbar` component (in `src/components/Navbar.tsx`) across screens — that's the current navigation pattern.

- Integration points and external services
  - There is no backend in this repo. Any AI integration should be implemented in a new client module (e.g. `src/lib/api/ai.ts`) or a hook (e.g. `src/lib/hooks/useAI.ts`) and should return messages matching the shape above.
  - When adding network calls, follow the project's TypeScript patterns and keep calls off the render path (use effects or event handlers).

- Project-specific conventions
  - File names use PascalCase for components and screens (e.g. `Chat.tsx`, `Modal.tsx`).
  - Keep UI state local unless multiple screens need it — there is no global state manager in the repo.
  - Use `Date` objects for timestamps in messages (not strings). If serializing, convert via `toISOString()`.

- Quick examples
  - Creating a new route:
    1. Add `src/screens/Stats/Stats.tsx` exporting `export const Stats = () => (...)`.
    2. Import and register it in `src/index.tsx` with `<Route path="/stats" element={<Stats/>} />`.

  - Hooking up an AI response (replace demo in `Chat.tsx`):
    - Create `src/lib/api/ai.ts` that exports `async function sendMessage(text: string) : Promise<Message>` and returns an object matching the message shape.
    - In `Chat.tsx` replace the `setTimeout` demo with an async call and append the result to `messages`.

- Debugging tips
  - The app uses Vite. Runtime errors will appear in the browser console and the terminal running `npm run dev`.
  - If Tailwind styles don't apply, verify `tailwind.css` is imported by `index.html` or the entry CSS file and that `tailwind.config.js` includes the correct content globs (`./src/**/*.{html,js,ts,jsx,tsx}`).

- Files to check first when editing UI
  - `src/screens/Chat/Chat.tsx` — shows messaging structure and component patterns.
  - `src/components/Modal.tsx` — demonstrates effects + cleanup and accessible close behavior.
  - `src/lib/utils.ts` — `cn` helper for classes.
  - `vite.config.ts` & `package.json` — dev/build commands and server port override (8080).

If anything above is unclear or you want the file to include more examples (tests, linting, or CI specifics), tell me which area to expand and I'll iterate.
