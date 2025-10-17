/// <reference types="vite/client" />

interface ImportMeta {
  url: string;
}

// Minimal declarations so the editor doesn't underline Node built-in imports in vite.config.ts
declare module "path" {
  const anyPath: any;
  export = anyPath;
}

declare module "url" {
  export const fileURLToPath: any;
}

// Allow importing CSS files
declare module "*.css";
declare module "*.scss";
declare module "*.sass";
declare module 'react-speech-recognition';
declare module 'speak-tts';
declare module 'lovable-tagger';
