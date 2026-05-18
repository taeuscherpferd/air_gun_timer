import { invoke } from "@tauri-apps/api/core";

import type { SelectionOption } from "@/domain/timerTypes";

interface WebAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export class ResultAudio {
  private static audioContext: AudioContext | null = null;
  private static currentAudioElement: HTMLAudioElement | null = null;
  private static currentAudioSource: AudioBufferSourceNode | null = null;

  static async prepare(): Promise<void> {
    try {
      const audioContext = await this.getReadyAudioContext();

      if (!audioContext) {
        return;
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
      source.connect(audioContext.destination);
      source.start();
    } catch {
      return;
    }
  }

  static async play(option: SelectionOption | undefined, readSelectionAloud: boolean): Promise<void> {
    this.stop();

    if (!option) {
      return;
    }

    if (option.audioDataUrl) {
      await this.playAudioFile(option.audioDataUrl);
      return;
    }

    if (readSelectionAloud) {
      await this.speak(option.label);
    }
  }

  static stop(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }

    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
      } catch {
        // The source may have already ended.
      }

      this.currentAudioSource = null;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    void this.stopNativeSpeech();
  }

  private static async playAudioFile(audioDataUrl: string): Promise<void> {
    try {
      const audioContext = await this.getReadyAudioContext();

      if (audioContext) {
        await this.playWithAudioContext(audioDataUrl, audioContext);
        return;
      }
    } catch {
      await this.playWithAudioElement(audioDataUrl);
      return;
    }

    await this.playWithAudioElement(audioDataUrl);
  }

  private static async speak(text: string): Promise<void> {
    if (await this.speakWithNativeTts(text)) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  private static async speakWithNativeTts(text: string): Promise<boolean> {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return false;
    }

    if (!window.__TAURI_INTERNALS__) {
      return false;
    }

    try {
      await invoke<void>("plugin:android-tts|speak", { text: trimmedText });
      return true;
    } catch {
      return false;
    }
  }

  private static async stopNativeSpeech(): Promise<void> {
    if (!window.__TAURI_INTERNALS__) {
      return;
    }

    try {
      await invoke<void>("plugin:android-tts|stop");
    } catch {
      return;
    }
  }

  private static async getReadyAudioContext(): Promise<AudioContext | null> {
    const AudioContextConstructor =
      window.AudioContext ?? (window as WebAudioWindow).webkitAudioContext;

    if (!AudioContextConstructor) {
      return null;
    }

    if (!this.audioContext || this.audioContext.state === "closed") {
      this.audioContext = new AudioContextConstructor();
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    if (this.audioContext.state !== "running") {
      return null;
    }

    return this.audioContext;
  }

  private static async playWithAudioContext(
    audioDataUrl: string,
    audioContext: AudioContext
  ): Promise<void> {
    const response = await fetch(audioDataUrl);
    const audioData = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(audioData);
    const source = audioContext.createBufferSource();

    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.addEventListener(
      "ended",
      () => {
        if (this.currentAudioSource === source) {
          this.currentAudioSource = null;
        }
      },
      { once: true }
    );

    this.currentAudioSource = source;
    source.start();
  }

  private static async playWithAudioElement(audioDataUrl: string): Promise<void> {
    const audio = new Audio(audioDataUrl);
    this.currentAudioElement = audio;

    try {
      await audio.play();
    } catch {
      throw new Error("The selected audio file could not be played.");
    }
  }
}
