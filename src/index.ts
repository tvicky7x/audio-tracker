export { mediaSessionModule } from "./modules/mediaSessionModule";

type AudioTrackerOptions = {
  preload?: "none" | "metadata" | "auto";
  loop?: boolean;
  muted?: boolean;
  autoplay?: boolean;
  crossOrigin?: string;
  volume?: number;
  /**
   * Metadata for browser Media Session API
   */
  mediaSession?: MediaMetadataInit;
};

type Callbacks = {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onRateChange?: (playbackRate: number) => void;
  onVolumeChange?: (volume: number) => void;
  onMuteChange?: (muted: boolean) => void;
  onBufferChange?: (bufferedTime: number) => void;
  onBufferPercentageChange?: (percentage: number) => void;
  onPlaying?: () => void;
  onSeeking?: (currentTime: number) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onWaiting?: () => void;
  onStalled?: () => void;
  onError?: (error: MediaError | null) => void;
  onDurationChange?: (duration: number) => void;
};

export default class AudioTracker {
  private audio: HTMLAudioElement;
  private isExternalAudio: boolean;
  public options: AudioTrackerOptions;
  private duration: number;
  private previousMutedState: boolean;
  private callbacks: Callbacks;
  private subscribers: { [eventName: string]: Array<(event: Event) => void> };
  private boundHandlers: { [eventName: string]: (event: Event) => void };
  private cleanupFunctions: Array<() => void>;

  /**
   * Creates an instance of AudioTracker.
   * @param audioSource - Either an HTMLAudioElement or a string URL for the audio source
   * @param options - Optional settings such as loop, volume, preload, and autoplay
   */
  constructor(
    audioSource: HTMLAudioElement | string,
    options: AudioTrackerOptions = {}
  ) {
    if (audioSource instanceof HTMLAudioElement) {
      this.audio = audioSource;
      this.isExternalAudio = true;
    } else if (typeof audioSource === "string") {
      this.audio = new Audio(audioSource);
      this.isExternalAudio = false;
    } else {
      throw new Error(
        "AudioTracker: audioSource must be either a string URL or HTMLAudioElement"
      );
    }

    this.options = options;

    if (!this.isExternalAudio) {
      this.audio.preload = options.preload || "metadata";
      this.audio.loop = options.loop || false;
      this.audio.muted = options.muted || false;
      this.audio.autoplay = options.autoplay || false;

      if (options.crossOrigin) {
        this.audio.crossOrigin = options.crossOrigin;
      }

      if (typeof options.volume === "number") {
        // Ensure volume between 0-100 then convert to 0-1 range
        this.audio.volume = Math.min(Math.max(options.volume, 0), 100) / 100;
      }
    }

    this.duration = 0;
    this.previousMutedState = this.audio.muted;
    this.callbacks = {};
    this.subscribers = {};
    this.boundHandlers = {};
    this.cleanupFunctions = [];
  }

  // ===============================
  // Event system methods
  // ===============================

  /**
   * Subscribe to an audio event with a callback.
   * @param eventName - The name of the audio event to listen for
   * @param callback - The callback function to execute when the event fires
   */
  subscribe(eventName: string, callback: (event: Event) => void): void {
    if (!this.subscribers[eventName]) {
      this.subscribers[eventName] = [];
      this._attachDOMListener(eventName);
    }
    this.subscribers[eventName].push(callback);
  }

  /**
   * Unsubscribe a callback from an audio event.
   * @param eventName - The event name to stop listening to
   * @param callback - The callback function to remove
   */
  unsubscribe(eventName: string, callback: (event: Event) => void): void {
    if (!this.subscribers[eventName]) return;
    this.subscribers[eventName] = this.subscribers[eventName].filter(
      (cb) => cb !== callback
    );

    if (this.subscribers[eventName].length === 0) {
      this._detachDOMListener(eventName);
      delete this.subscribers[eventName];
    }
  }

  private _attachDOMListener(eventName: string): void {
    if (this.boundHandlers[eventName]) {
      // Listener already attached
      return;
    }
    const handler = (event: Event) => {
      if (this.subscribers[eventName]) {
        this.subscribers[eventName].forEach((callback) => callback(event));
      }
    };
    this.boundHandlers[eventName] = handler;
    this.audio.addEventListener(eventName, handler);
  }

  private _detachDOMListener(eventName: string): void {
    if (this.boundHandlers[eventName]) {
      this.audio.removeEventListener(eventName, this.boundHandlers[eventName]);
      delete this.boundHandlers[eventName];
    }
  }

  // ===============================
  // Initialization with callbacks
  // ===============================

  /**
   * Initializes event callbacks for audio events.
   * @param callbacks - An object of callback functions for audio event hooks
   * @returns The AudioTracker instance (for chaining)
   */
  init(callbacks: Callbacks = {}): this {
    this.callbacks = { ...this.callbacks, ...callbacks };

    if (callbacks.onPlay) {
      this.subscribe("play", () => this.callbacks.onPlay?.());
    }
    if (callbacks.onPause) {
      this.subscribe("pause", () => this.callbacks.onPause?.());
    }
    if (callbacks.onEnded) {
      this.subscribe("ended", () => this.callbacks.onEnded?.());
    }
    if (callbacks.onTimeUpdate) {
      this.subscribe("timeupdate", () => {
        this.callbacks.onTimeUpdate?.(this.audio.currentTime);
      });
    }
    if (callbacks.onRateChange) {
      this.subscribe("ratechange", () => {
        this.callbacks.onRateChange?.(this.audio.playbackRate);
      });
    }
    if (callbacks.onVolumeChange || callbacks.onMuteChange) {
      this.subscribe("volumechange", () => {
        const currentMutedState = this.audio.muted;

        if (currentMutedState !== this.previousMutedState) {
          this.callbacks.onMuteChange?.(currentMutedState);
          this.previousMutedState = currentMutedState;
        }

        this.callbacks.onVolumeChange?.(this.audio.volume * 100);
      });
    }
    if (callbacks.onBufferChange || callbacks.onBufferPercentageChange) {
      this.subscribe("progress", () => {
        this.updateBuffer();
      });
    }
    if (callbacks.onPlaying) {
      this.subscribe("playing", () => this.callbacks.onPlaying?.());
    }
    if (callbacks.onSeeking) {
      this.subscribe("seeking", () => {
        this.callbacks.onSeeking?.(this.audio.currentTime);
      });
    }
    if (callbacks.onLoadStart) {
      this.subscribe("loadstart", () => this.callbacks.onLoadStart?.());
    }
    if (callbacks.onCanPlay) {
      this.subscribe("canplay", () => this.callbacks.onCanPlay?.());
    }
    if (callbacks.onWaiting) {
      this.subscribe("waiting", () => this.callbacks.onWaiting?.());
    }
    if (callbacks.onStalled) {
      this.subscribe("stalled", () => this.callbacks.onStalled?.());
    }
    if (callbacks.onError) {
      this.subscribe("error", () => this.callbacks.onError?.(this.audio.error));
    }

    if (this.audio.readyState >= 1) {
      this.duration = this.audio.duration;
      callbacks.onDurationChange?.(this.duration);
      if (callbacks.onBufferChange || callbacks.onBufferPercentageChange) {
        this.updateBuffer();
      }
    } else if (callbacks.onDurationChange) {
      this.subscribe("loadedmetadata", () => {
        this.duration = this.audio.duration;
        this.callbacks.onDurationChange?.(this.duration);
        if (callbacks.onBufferChange || callbacks.onBufferPercentageChange) {
          this.updateBuffer();
        }
      });
    }

    return this;
  }

  /**
   * Updates buffer status and triggers buffer callbacks.
   */
  updateBuffer(): void {
    if (this.audio.buffered.length > 0) {
      const bufferedTime = this.audio.buffered.end(
        this.audio.buffered.length - 1
      );
      this.callbacks.onBufferChange?.(bufferedTime);

      if (this.duration > 0) {
        const bufferedPercentage = (bufferedTime / this.duration) * 100;
        this.callbacks.onBufferPercentageChange?.(bufferedPercentage);
      }
    }
  }

  // ===============================
  // Module system
  // ===============================

  /**
   * Uses an external module factory with AudioTracker instance.
   * @param moduleFactory - Function accepting AudioTracker and returning optional cleanup function
   * @returns The AudioTracker instance (for chaining)
   */
  use(
    moduleFactory: (audioTracker: AudioTracker) => void | (() => void)
  ): this {
    const cleanup = moduleFactory(this);

    if (typeof cleanup === "function") {
      this.cleanupFunctions.push(cleanup);
    }

    return this;
  }

  // ===============================
  // Audio control methods
  // ===============================

  /**
   * Plays the audio.
   * @returns A Promise that resolves when playback starts
   */
  play(): Promise<void> {
    return this.audio.play();
  }

  /**
   * Pauses the audio.
   */
  pause(): void {
    this.audio.pause();
  }

  /**
   * Seeks audio to a specified time.
   * @param time - Time in seconds to seek to
   */
  seekTo(time: number): void {
    this.audio.currentTime = Math.max(0, Math.min(time, this.duration));
  }

  /**
   * Moves forward in the audio by given seconds.
   * @param seconds - Seconds to move forward (default: 10)
   */
  forward(seconds = 10): void {
    this.audio.currentTime = Math.min(
      this.audio.currentTime + seconds,
      this.duration
    );
  }

  /**
   * Moves backward in the audio by given seconds.
   * @param seconds - Seconds to move backward (default: 10)
   */
  backward(seconds = 10): void {
    this.audio.currentTime = Math.max(this.audio.currentTime - seconds, 0);
  }

  /**
   * Sets the audio volume.
   * @param value - Volume value from 0 to 100
   */
  setVolume(value: number): void {
    this.audio.volume = Math.max(0, Math.min(value, 100)) / 100;
  }

  /**
   * Gets the current audio volume.
   * @returns Volume from 0 to 100
   */
  getVolume(): number {
    return this.audio.volume * 100;
  }

  /**
   * Sets muted state.
   * @param muted - true to mute, false to unmute
   */
  setMuted(muted: boolean): void {
    this.audio.muted = Boolean(muted);
  }

  /**
   * Toggles muted state.
   * @returns Current muted state after toggling
   */
  toggleMute(): boolean {
    this.audio.muted = !this.audio.muted;
    return this.audio.muted;
  }

  /**
   * Checks if audio is muted.
   * @returns true if muted, otherwise false
   */
  isMuted(): boolean {
    return this.audio.muted;
  }

  /**
   * Sets playback speed rate.
   * @param rate - Playback rate between 0.25 and 4
   */
  setPlaybackRate(rate: number): void {
    this.audio.playbackRate = Math.max(0.25, Math.min(rate, 4));
  }

  /**
   * Gets current playback rate.
   * @returns Playback speed rate
   */
  getPlaybackRate(): number {
    return this.audio.playbackRate;
  }

  /**
   * Sets looping on/off.
   * @param loop - true to loop, false to disable loop
   */
  setLoop(loop: boolean): void {
    this.audio.loop = Boolean(loop);
  }

  /**
   * Checks if looping is enabled.
   * @returns true if looping, else false
   */
  isLooping(): boolean {
    return this.audio.loop;
  }

  /**
   * Sets autoplay on/off.
   * @param autoplay - true to autoplay, else false
   */
  setAutoplay(autoplay: boolean): void {
    this.audio.autoplay = Boolean(autoplay);
  }

  /**
   * Gets current autoplay setting.
   * @returns true if autoplay enabled, else false
   */
  getAutoplay(): boolean {
    return this.audio.autoplay;
  }

  /**
   * Sets crossOrigin attribute.
   * @param crossOrigin - string value for crossOrigin
   */
  setCrossOrigin(crossOrigin: string): void {
    this.audio.crossOrigin = crossOrigin;
  }

  /**
   * Gets crossOrigin attribute value.
   * @returns crossOrigin string or null
   */
  getCrossOrigin(): string | null {
    return this.audio.crossOrigin;
  }

  /**
   * Sets preload attribute.
   * @param preload - string value for preload (e.g. "auto", "metadata")
   */
  setPreload(preload: "none" | "metadata" | "auto"): void {
    this.audio.preload = preload;
  }

  /**
   * Gets current preload setting.
   * @returns preload string
   */
  getPreload(): string {
    return this.audio.preload;
  }

  /**
   * Gets readyState of the audio element.
   * @returns readyState number
   */
  getReadyState(): number {
    return this.audio.readyState;
  }

  /**
   * Gets networkState of the audio element.
   * @returns networkState number
   */
  getNetworkState(): number {
    return this.audio.networkState;
  }

  /**
   * Checks if audio is currently playing.
   * @returns true if playing, else false
   */
  isPlaying(): boolean {
    return !this.audio.paused && !this.audio.ended && this.audio.readyState > 2;
  }

  /**
   * Gets total duration of the audio.
   * @returns duration in seconds
   */
  getDuration(): number {
    return this.duration;
  }

  /**
   * Gets current playback time.
   * @returns current time in seconds
   */
  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  /**
   * Gets time remaining until audio ends.
   * @returns seconds remaining
   */
  getTimeRemaining(): number {
    return Math.max(0, this.duration - this.audio.currentTime);
  }

  // ===============================
  // Utilities
  // ===============================

  /**
   * Formats seconds to M:SS string format.
   * @param seconds - time in seconds
   * @returns formatted time string (e.g. "2:04")
   */
  formatTime(seconds: number | undefined): string {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  /**
   * Returns the underlying HTMLAudioElement.
   * @returns the HTMLAudioElement instance
   */
  getAudioElement(): HTMLAudioElement {
    return this.audio;
  }

  // ===============================
  // Cleanup
  // ===============================

  /**
   * Cleanup and destroy AudioTracker instance.
   */
  destroy(): void {
    if (this.isExternalAudio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio.load();
    } else {
      this.cleanupFunctions.forEach((fn) => fn());
      this.cleanupFunctions = [];
      Object.keys(this.boundHandlers).forEach((eventName) => {
        this._detachDOMListener(eventName);
      });

      this.subscribers = {};
      this.callbacks = {};
    }
  }
}
