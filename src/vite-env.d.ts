/// <reference types="vite/client" />

interface Window {
  GunTimerAndroidSpeech?: {
    speak(text: string): boolean;
    stop(): void;
  };
  __TAURI_INTERNALS__?: Record<string, never>;
}
