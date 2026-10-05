// Silent Sound Engine (Sound effects removed per user specification)
class SoundEngine {
  constructor() {
    this.muted = true;
  }

  init() {}
  toggleMute() { return true; }
  playClick() {}
  playSuccess() {}
  playDuplicate() {}
  playWarning() {}
  playAlert() {}
  playPassUnlocked() {}
  playGateOpen() {}
}

export const sound = new SoundEngine();
