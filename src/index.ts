export { mediaSessionModule } from "./modules/mediaSessionModule";
export { timestampModule } from "./modules/timestampModule";

/**
 * Configuration options for AudioTracker initialization
 */
interface AudioTrackerOptions {
  preload?: "none" | "metadata" | "auto";
  loop?: boolean;
  muted?: boolean;
  autoplay?: boolean;
  crossOrigin?: "anonymous" | "use-credentials" | null;
  volume?: number;
}

/**
 * Callback functions for audio events
 */
interface AudioCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onRateChange?: (rate: number) => void;
  onVolumeChange?: (volume: number) => void;
  onMuteChange?: (isMuted: boolean) => void;
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
}

/**
 * Type for module functions that can extend AudioTracker functionality
 */
type AudioModule = (tracker: AudioTracker) => void | (() => void);

/**
 * A headless JavaScript library that gives you full control over web audio with advanced tracking and control features.
 * Provides a clean API for audio manipulation, event handling, and modular extensions.
 */
export default class AudioTracker {
  private audio: HTMLAudioElement;
  private isExternalAudio: boolean;
  private options: AudioTrackerOptions;
  private duration: number;
  private previousMutedState: boolean;
  private callbacks: AudioCallbacks;
  private subscribers: Record<string, Array<(event: Event) => void>>;
  private boundHandlers: Record<string, (event: Event) => void>;
  private cleanupFunctions: Array<() => void>;

  constructor(
    audioSource: string | HTMLAudioElement,
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

  // ============================================
  // Event System
  // ============================================

  /**
   * Subscribe to audio element DOM events
   * @param eventName - Name of the audio event (e.g., 'play', 'pause', 'timeupdate')
   * @param callback - Function to execute when event fires
   * @example
   * tracker.subscribe('play', () => console.log('Audio started playing'));
   */
  public subscribe(eventName: string, callback: (event: Event) => void): void {
    if (!this.subscribers[eventName]) {
      this.subscribers[eventName] = [];
      this._attachDOMListener(eventName);
    }
    this.subscribers[eventName].push(callback);
  }

  /**
   * Unsubscribe from audio element DOM events
   * @param eventName - Name of the audio event
   * @param callback - The specific callback function to remove
   * @example
   * const handler = () => console.log('Playing');
   * tracker.subscribe('play', handler);
   * tracker.unsubscribe('play', handler);
   */
  public unsubscribe(
    eventName: string,
    callback: (event: Event) => void
  ): void {
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

  // ============================================
  // Initialization with callbacks
  // ============================================

  /**
   * Initialize AudioTracker with callback functions for various audio events
   * @param callbacks - Object containing callback functions for audio events
   * @returns The AudioTracker instance for method chaining
   * @example
   * tracker.init({
   *   onPlay: () => console.log('Playing'),
   *   onTimeUpdate: (time) => console.log(`Current time: ${time}`),
   *   onEnded: () => console.log('Playback finished')
   * });
   */
  public init(callbacks: AudioCallbacks = {}): this {
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

  private updateBuffer(): void {
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

  // ============================================
  // Module System
  // ============================================

  /**
   * Extend AudioTracker functionality with a module
   * @param module - Function that receives the tracker instance and returns an optional cleanup function
   * @returns The AudioTracker instance for method chaining
   * @example
   * tracker.use(mediaSessionModule).use(timestampModule);
   */
  public use(module: AudioModule): this {
    const cleanup = module(this);

    if (typeof cleanup === "function") {
      this.cleanupFunctions.push(cleanup);
    }

    return this;
  }

  // ============================================
  // Controls
  // ============================================

  /**
   * Start audio playback
   * @returns Promise that resolves when playback begins
   * @example
   * await tracker.play();
   */
  public play(): Promise<void> {
    return this.audio.play().catch((e) => {
      console.warn("Playback failed:", e);
    });
  }

  /**
   * Pause audio playback
   * @example
   * tracker.pause();
   */
  public pause(): void {
    this.audio.pause();
  }

  /**
   * Toggle playback state between play and pause
   * @returns Promise that resolves when playback starts or void if paused
   * @example
   * await tracker.togglePlay();
   */
  public togglePlay(): Promise<void> | void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      return this.play();
    }
  }

  /**
   * Seek to a specific time position in the audio
   * @param time - Time position in seconds
   * @example
   * tracker.seekTo(30); // Jump to 30 seconds
   */
  public seekTo(time: number): void {
    const duration = this.duration || this.audio.duration || 0;
    this.audio.currentTime = Math.max(0, Math.min(time, duration));
  }

  /**
   * Skip forward by a specified number of seconds
   * @param seconds - Number of seconds to skip forward (default: 10)
   * @example
   * tracker.forward(15); // Skip forward 15 seconds
   */
  public forward(seconds: number = 10): void {
    const newTime = Math.min(this.audio.currentTime + seconds, this.duration);
    this.audio.currentTime = newTime;
  }

  /**
   * Skip backward by a specified number of seconds
   * @param seconds - Number of seconds to skip backward (default: 10)
   * @example
   * tracker.backward(15); // Skip back 15 seconds
   */
  public backward(seconds: number = 10): void {
    const newTime = Math.max(this.audio.currentTime - seconds, 0);
    this.audio.currentTime = newTime;
  }

  /**
   * Set the audio volume level
   * @param value - Volume level from 0 to 100
   * @example
   * tracker.setVolume(75); // Set volume to 75%
   */
  public setVolume(value: number): void {
    if (typeof value === "number") {
      const clampedValue = Math.max(0, Math.min(value, 100));
      this.audio.volume = clampedValue / 100;
    }
  }

  /**
   * Get the current volume level
   * @returns Current volume as a percentage (0-100)
   * @example
   * const volume = tracker.getVolume(); // Returns 75
   */
  public getVolume(): number {
    return this.audio.volume * 100;
  }

  /**
   * Set the muted state of the audio
   * @param muted - True to mute, false to unmute
   * @example
   * tracker.setMuted(true); // Mute audio
   */
  public setMuted(muted: boolean): void {
    this.audio.muted = Boolean(muted);
  }

  /**
   * Toggle the muted state of the audio
   * @returns The new muted state (true if now muted, false if unmuted)
   * @example
   * const isMuted = tracker.toggleMute(); // Toggle and get new state
   */
  public toggleMute(): boolean {
    this.audio.muted = !this.audio.muted;
    this.callbacks.onMuteChange?.(this.audio.muted);

    return this.audio.muted;
  }

  /**
   * Check if audio is currently muted
   * @returns True if muted, false otherwise
   * @example
   * if (tracker.isMuted()) console.log('Audio is muted');
   */
  public isMuted(): boolean {
    return this.audio.muted;
  }

  /**
   * Set the playback speed rate
   * @param rate - Playback rate (0.5 = half speed, 1.0 = normal, 2.0 = double speed)
   * @example
   * tracker.setPlaybackRate(1.5); // Play at 1.5x speed
   */
  public setPlaybackRate(rate: number): void {
    this.audio.playbackRate = rate;
  }

  /**
   * Get the current playback speed rate
   * @returns Current playback rate
   * @example
   * const rate = tracker.getPlaybackRate(); // Returns 1.5
   */
  public getPlaybackRate(): number {
    return this.audio.playbackRate;
  }

  /**
   * Enable or disable audio looping
   * @param loop - True to enable loop, false to disable
   * @example
   * tracker.setLoop(true); // Enable continuous looping
   */
  public setLoop(loop: boolean): void {
    this.audio.loop = Boolean(loop);
  }

  /**
   * Check if audio looping is enabled
   * @returns True if looping is enabled
   * @example
   * if (tracker.isLooping()) console.log('Loop is enabled');
   */
  public isLooping(): boolean {
    return this.audio.loop;
  }

  /**
   * Enable or disable autoplay
   * @param autoplay - True to enable autoplay, false to disable
   * @example
   * tracker.setAutoplay(true); // Enable autoplay
   */
  public setAutoplay(autoplay: boolean): void {
    this.audio.autoplay = Boolean(autoplay);
  }

  /**
   * Check if autoplay is enabled
   * @returns True if autoplay is enabled
   * @example
   * const hasAutoplay = tracker.getAutoplay();
   */
  public getAutoplay(): boolean {
    return this.audio.autoplay;
  }

  /**
   * Set CORS settings for the audio element
   * @param crossOrigin - CORS setting ('anonymous', 'use-credentials', or null)
   * @example
   * tracker.setCrossOrigin('anonymous');
   */
  public setCrossOrigin(
    crossOrigin: "anonymous" | "use-credentials" | null
  ): void {
    this.audio.crossOrigin = crossOrigin;
  }

  /**
   * Get the current CORS setting
   * @returns Current crossOrigin value
   * @example
   * const cors = tracker.getCrossOrigin();
   */
  public getCrossOrigin(): string | null {
    return this.audio.crossOrigin;
  }

  /**
   * Set the preload behavior for the audio
   * @param preload - Preload setting ('none', 'metadata', or 'auto')
   * @example
   * tracker.setPreload('metadata'); // Preload only metadata
   */
  public setPreload(preload: "none" | "metadata" | "auto"): void {
    this.audio.preload = preload;
  }

  /**
   * Get the current preload setting
   * @returns Current preload value
   * @example
   * const preload = tracker.getPreload();
   */
  public getPreload(): string {
    return this.audio.preload;
  }

  /**
   * Get the ready state of the audio element
   * @returns Ready state (0: HAVE_NOTHING, 1: HAVE_METADATA, 2: HAVE_CURRENT_DATA, 3: HAVE_FUTURE_DATA, 4: HAVE_ENOUGH_DATA)
   * @example
   * const state = tracker.getReadyState();
   */
  public getReadyState(): number {
    return this.audio.readyState;
  }

  /**
   * Get the network state of the audio element
   * @returns Network state (0: NETWORK_EMPTY, 1: NETWORK_IDLE, 2: NETWORK_LOADING, 3: NETWORK_NO_SOURCE)
   * @example
   * const networkState = tracker.getNetworkState();
   */
  public getNetworkState(): number {
    return this.audio.networkState;
  }

  /**
   * Check if audio is currently playing
   * @returns True if audio is playing, false otherwise
   * @example
   * if (tracker.isPlaying()) console.log('Audio is playing');
   */
  public isPlaying(): boolean {
    return !this.audio.paused && !this.audio.ended && this.audio.readyState > 2;
  }

  /**
   * Get the total duration of the audio
   * @returns Duration in seconds
   * @example
   * const duration = tracker.getDuration(); // Returns 180 (3 minutes)
   */
  public getDuration(): number {
    return this.duration;
  }

  /**
   * Get the current playback time position
   * @returns Current time in seconds
   * @example
   * const currentTime = tracker.getCurrentTime(); // Returns 45.5
   */
  public getCurrentTime(): number {
    return this.audio.currentTime;
  }

  /**
   * Get the remaining time until audio ends
   * @returns Remaining time in seconds
   * @example
   * const remaining = tracker.getTimeRemaining(); // Returns 134.5
   */
  public getTimeRemaining(): number {
    return Math.max(0, this.duration - this.audio.currentTime);
  }

  // ============================================
  // Utilities
  // ============================================

  /**
   * Format seconds into MM:SS format
   * @param seconds - Time in seconds to format
   * @returns Formatted time string (e.g., "3:45")
   * @example
   * const formatted = tracker.formatTime(225); // Returns "3:45"
   */
  public formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  /**
   * Get direct access to the underlying HTMLAudioElement
   * @returns The HTMLAudioElement instance
   * @example
   * const audioElement = tracker.getAudioElement();
   * audioElement.addEventListener('canplaythrough', callback);
   */
  public getAudioElement(): HTMLAudioElement {
    return this.audio;
  }

  // ============================================
  // Cleanup
  // ============================================

  /**
   * Clean up all resources and event listeners. Call this when done using the tracker.
   * @example
   * tracker.destroy(); // Clean up before removing component
   */
  public destroy(): void {
    this.cleanupFunctions.forEach((fn) => fn());
    this.cleanupFunctions = [];

    Object.keys(this.boundHandlers).forEach((eventName) => {
      this._detachDOMListener(eventName);
    });

    this.audio.pause();

    if (!this.isExternalAudio) {
      this.audio.src = "";
      this.audio.load();
    }

    this.subscribers = {};
    this.callbacks = {};
  }
}
