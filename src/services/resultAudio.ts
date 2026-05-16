import type { SelectionOption } from "@/domain/timerTypes";

export class ResultAudio {
  private static currentAudio: HTMLAudioElement | null = null;

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
      this.speak(option.label);
    }
  }

  static stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  private static async playAudioFile(audioDataUrl: string): Promise<void> {
    const audio = new Audio(audioDataUrl);
    this.currentAudio = audio;

    try {
      await audio.play();
    } catch {
      throw new Error("The selected audio file could not be played.");
    }
  }

  private static speak(text: string): void {
    if (!("speechSynthesis" in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
}
