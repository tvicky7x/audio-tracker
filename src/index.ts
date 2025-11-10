/**
 * AudioTracker - A headless audio playback library with Media Session API integration
 *
 * @example
 * ```
 * // Create tracker with URL
 * const tracker = new AudioTracker('audio.mp3', {
 *   volume: 50,
 *   preload: 'auto',
 *   mediaSession: {
 *     title: 'Song Title',
 *     artist: 'Artist Name'
 *   }
 * });
 *
 * // Initialize with callbacks
 * tracker.init({
 *   onPlay: () => console.log('Playing'),
 *   onTimeUpdate: (time) => console.log(time),
 *   onDurationChange: (duration) => console.log(duration)
 * });
 *
 * // Control playback
 * await tracker.play();
 * tracker.pause();
 * tracker.seekTo(30);
 * ```
 */

/**
 * Artwork configuration for Media Session API
 */
interface MediaSessionArtwork {
  /** Image URL */
  src: string;
  /** Image sizes (e.g., "96x96", "128x128") */
  sizes?: string;
  /** Image MIME type (e.g., "image/png") */
  type?: string;
}

/**
 * Media Session metadata configuration
 */
interface MediaSessionMetadata {
  /** Track or media title */
  title?: string;
  /** Artist or creator name */
  artist?: string;
  /** Album or collection name */
  album?: string;
  /** Array of artwork images */
  artwork?: MediaSessionArtwork[];
}

/**
 * Audio tracker initialization options
 */
interface AudioTrackerOptions {
  /** Preload strategy: "none" | "metadata" | "auto" */
  preload?: "none" | "metadata" | "auto";
  /** Enable audio looping */
  loop?: boolean;
  /** Mute audio on init */
  muted?: boolean;
  /** Autoplay audio (subject to browser policies) */
  autoplay?: boolean;
  /** CORS policy: "anonymous" | "use-credentials" */
  crossOrigin?: string;
  /** Initial volume (0-100) */
  volume?: number;
  /** Media Session API metadata */
  mediaSession?: MediaSessionMetadata;
}

/**
 * Volume change event data
 */
interface VolumeChangeData {
  /** Current volume (0-100) */
  volume: number;
  /** Mute state */
  muted: boolean;
}

/**
 * Audio tracker event callbacks
 */
interface AudioTrackerCallbacks {
  /** Fired when playback starts */
  onPlay?: () => void;
  /** Fired when playback pauses */
  onPause?: () => void;
  /** Fired when playback reaches the end */
  onEnded?: () => void;
  /** Fired continuously during playback with current time */
  onTimeUpdate?: (currentTime: number) => void;
  /** Fired when duration metadata is loaded */
  onDurationChange?: (duration: number) => void;
  /** Fired when browser starts loading audio */
  onLoadStart?: () => void;
  /** Fired when enough data is available to play */
  onCanPlay?: () => void;
  /** Fired when playback stops due to buffering */
  onWaiting?: () => void;
  /** Fired when playback resumes after buffering */
  onPlaying?: () => void;
  /** Fired when network stalls */
  onStalled?: () => void;
  /** Fired when seeking operation starts */
  onSeeking?: (seekTime: number) => void;
  /** Fired when buffered time updates */
  onBufferChange?: (bufferedTime: number) => void;
  /** Fired when buffered percentage updates */
  onBufferPercentageChange?: (percentage: number) => void;
  /** Fired when volume or mute state changes */
  onVolumeChange?: (data: VolumeChangeData) => void;
  /** Fired when playback rate changes */
  onRateChange?: (rate: number) => void;
  /** Fired on playback errors */
  onError?: (error: MediaError | null) => void;
}

/**
 * AudioTracker - Headless audio playback library with comprehensive event tracking
 * and Media Session API integration for system-level media controls.
 *
 * @class
 */
export default class AudioTracker {
  private audio: HTMLAudioElement;
  private isExternalAudio: boolean;
  private options: AudioTrackerOptions;
  private callbacks: AudioTrackerCallbacks;
  private mediaSessionEnabled: boolean;
  private duration: number;
  private cleanupFunction: (() => void) | null;

  /**
   * Creates a new AudioTracker instance
   *
   * @param audioSource - Audio file URL or existing HTMLAudioElement
   * @param options - Configuration options for the audio tracker
   *
   * @throws {Error} If audioSource is neither a string nor HTMLAudioElement
   *
   * @example
   * ```
   * // With URL
   * const tracker = new AudioTracker('audio.mp3', { volume: 75 });
   *
   * // With existing element
   * const audioEl = document.querySelector('audio');
   * const tracker = new AudioTracker(audioEl);
   * ```
   */
  constructor(
    audioSource: string | HTMLAudioElement,
    options: AudioTrackerOptions = {}
  ) {
    // Validate and set audio source
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

    // Apply core audio attributes (only for internally created audio)
    if (!this.isExternalAudio) {
      this.audio.preload = options.preload || "metadata";
      this.audio.loop = options.loop || false;
      this.audio.muted = options.muted || false;
      this.audio.autoplay = options.autoplay || false;

      if (options.crossOrigin) {
        this.audio.crossOrigin = options.crossOrigin;
      }

      if (options.volume !== undefined) {
        this.audio.volume = options.volume / 100; // Convert 0-100 to 0-1
      }
    }

    // Initialize callback storage
    this.callbacks = {};
    this.mediaSessionEnabled = false;
    this.duration = 0;
    this.cleanupFunction = null;
  }

  /**
   * Initialize the tracker with event callbacks and start listening to audio events
   *
   * @param callbacks - Object containing event callback functions
   *
   * @example
   * ```
   * tracker.init({
   *   onPlay: () => console.log('Started playing'),
   *   onPause: () => console.log('Paused'),
   *   onTimeUpdate: (time) => updateProgressBar(time),
   *   onError: (error) => console.error('Playback error:', error)
   * });
   * ```
   */
  init(callbacks: AudioTrackerCallbacks = {}): void {
    this.callbacks = { ...this.callbacks, ...callbacks };

    /** Event: Audio metadata loaded (duration available) */
    const handleLoadedMetadata = (): void => {
      this.duration = this.audio.duration;
      this.callbacks.onDurationChange?.(this.duration);
      this.updateBuffer();
      this.updatePositionState();
    };

    /** Event: Browser downloads more data */
    const handleProgress = (): void => {
      this.updateBuffer();
    };

    /** Event: Playback position updates (continuous) */
    const handleTimeUpdate = (): void => {
      this.callbacks.onTimeUpdate?.(this.audio.currentTime);
    };

    /** Event: Seek operation completed */
    const handleSeeked = (): void => {
      this.updatePositionState();
    };

    /** Event: Playback speed changed */
    const handleRateChange = (): void => {
      this.updatePositionState();
      this.callbacks.onRateChange?.(this.audio.playbackRate);
    };

    /** Event: Playback ended */
    const handleEnded = (): void => {
      this.updatePositionState();
      this.updatePlaybackState("paused");
      this.callbacks.onEnded?.();
    };

    /** Event: Playback started */
    const handlePlay = (): void => {
      this.updatePositionState();
      this.updatePlaybackState("playing");
      this.callbacks.onPlay?.();
    };

    /** Event: Playback paused */
    const handlePause = (): void => {
      this.updatePositionState();
      this.updatePlaybackState("paused");
      this.callbacks.onPause?.();
    };

    /** Event: Volume or mute state changed */
    const handleVolumeChange = (): void => {
      this.callbacks.onVolumeChange?.({
        volume: this.audio.volume * 100,
        muted: this.audio.muted,
      });
    };

    /** Event: Playback stopped due to buffering */
    const handleWaiting = (): void => {
      this.callbacks.onWaiting?.();
    };

    /** Event: Playback resumed after buffering */
    const handlePlaying = (): void => {
      this.callbacks.onPlaying?.();
    };

    /** Event: Seeking started */
    const handleSeeking = (): void => {
      this.callbacks.onSeeking?.(this.audio.currentTime);
    };

    /** Event: Enough data available to play */
    const handleCanPlay = (): void => {
      this.callbacks.onCanPlay?.();
    };

    /** Event: Browser started loading */
    const handleLoadStart = (): void => {
      this.callbacks.onLoadStart?.();
    };

    /** Event: Network stalled (connection issue) */
    const handleStalled = (): void => {
      this.callbacks.onStalled?.();
    };

    /** Event: Error occurred */
    const handleError = (): void => {
      this.callbacks.onError?.(this.audio.error);
    };

    // Check if metadata already loaded
    if (this.audio.readyState >= 1) {
      this.duration = this.audio.duration;
      this.callbacks.onDurationChange?.(this.duration);
      this.updateBuffer();
    } else {
      this.audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    // Attach all event listeners
    this.audio.addEventListener("progress", handleProgress);
    this.audio.addEventListener("timeupdate", handleTimeUpdate);
    this.audio.addEventListener("seeked", handleSeeked);
    this.audio.addEventListener("ratechange", handleRateChange);
    this.audio.addEventListener("ended", handleEnded);
    this.audio.addEventListener("play", handlePlay);
    this.audio.addEventListener("pause", handlePause);
    this.audio.addEventListener("volumechange", handleVolumeChange);
    this.audio.addEventListener("waiting", handleWaiting);
    this.audio.addEventListener("playing", handlePlaying);
    this.audio.addEventListener("seeking", handleSeeking);
    this.audio.addEventListener("canplay", handleCanPlay);
    this.audio.addEventListener("loadstart", handleLoadStart);
    this.audio.addEventListener("stalled", handleStalled);
    this.audio.addEventListener("error", handleError);

    // Setup Media Session API if provided
    if (this.options.mediaSession) {
      this.setupMediaSession();
    }

    // Store cleanup function
    this.cleanupFunction = (): void => {
      this.audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      this.audio.removeEventListener("progress", handleProgress);
      this.audio.removeEventListener("timeupdate", handleTimeUpdate);
      this.audio.removeEventListener("seeked", handleSeeked);
      this.audio.removeEventListener("ratechange", handleRateChange);
      this.audio.removeEventListener("ended", handleEnded);
      this.audio.removeEventListener("play", handlePlay);
      this.audio.removeEventListener("pause", handlePause);
      this.audio.removeEventListener("volumechange", handleVolumeChange);
      this.audio.removeEventListener("waiting", handleWaiting);
      this.audio.removeEventListener("playing", handlePlaying);
      this.audio.removeEventListener("seeking", handleSeeking);
      this.audio.removeEventListener("canplay", handleCanPlay);
      this.audio.removeEventListener("loadstart", handleLoadStart);
      this.audio.removeEventListener("stalled", handleStalled);
      this.audio.removeEventListener("error", handleError);
    };
  }

  /**
   * Updates buffer progress and triggers callbacks
   * @private
   */
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

  /**
   * Updates Media Session API position state
   * @private
   */
  private updatePositionState(): void {
    if (!this.mediaSessionEnabled || !("mediaSession" in navigator)) {
      return;
    }

    if (this.audio.duration && !isNaN(this.audio.duration)) {
      try {
        navigator.mediaSession.setPositionState({
          duration: this.audio.duration,
          playbackRate: this.audio.playbackRate,
          position: this.audio.currentTime,
        });
      } catch (error) {
        console.warn("Failed to update Media Session position:", error);
      }
    }
  }

  /**
   * Updates Media Session API playback state
   * @private
   */
  private updatePlaybackState(state: MediaSessionPlaybackState): void {
    if (!this.mediaSessionEnabled || !("mediaSession" in navigator)) {
      return;
    }

    try {
      navigator.mediaSession.playbackState = state;
    } catch (error) {
      console.warn("Failed to update Media Session playback state:", error);
    }
  }

  /**
   * Formats seconds to MM:SS display format
   *
   * @param seconds - Time in seconds
   * @returns Formatted time string (e.g., "3:45")
   *
   * @example
   * ```
   * tracker.formatTime(125); // Returns "2:05"
   * tracker.formatTime(3661); // Returns "61:01"
   * ```
   */
  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  /**
   * Starts or resumes audio playback
   *
   * @returns Promise that resolves when playback begins
   *
   * @example
   * ```
   * await tracker.play();
   * ```
   */
  play(): Promise<void> {
    return this.audio.play();
  }

  /**
   * Pauses audio playback
   *
   * @example
   * ```
   * tracker.pause();
   * ```
   */
  pause(): void {
    this.audio.pause();
  }

  /**
   * Seeks to a specific time position
   *
   * @param time - Target time in seconds
   *
   * @example
   * ```
   * tracker.seekTo(30); // Jump to 30 seconds
   * tracker.seekTo(120); // Jump to 2 minutes
   * ```
   */
  seekTo(time: number): void {
    this.audio.currentTime = Math.max(0, Math.min(time, this.duration));
  }

  /**
   * Skips forward by specified seconds
   *
   * @param seconds - Number of seconds to skip forward (default: 10)
   *
   * @example
   * ```
   * tracker.forward(); // Skip 10 seconds
   * tracker.forward(30); // Skip 30 seconds
   * ```
   */
  forward(seconds: number = 10): void {
    const newTime = Math.min(this.audio.currentTime + seconds, this.duration);
    this.audio.currentTime = newTime;
    this.updatePositionState();
  }

  /**
   * Skips backward by specified seconds
   *
   * @param seconds - Number of seconds to skip backward (default: 10)
   *
   * @example
   * ```
   * tracker.backward(); // Rewind 10 seconds
   * tracker.backward(30); // Rewind 30 seconds
   * ```
   */
  backward(seconds: number = 10): void {
    const newTime = Math.max(this.audio.currentTime - seconds, 0);
    this.audio.currentTime = newTime;
    this.updatePositionState();
  }

  /**
   * Sets the audio volume
   *
   * @param value - Volume level (0-100)
   *
   * @example
   * ```
   * tracker.setVolume(50); // Set to 50%
   * tracker.setVolume(100); // Set to maximum
   * ```
   */
  setVolume(value: number): void {
    this.audio.volume = Math.max(0, Math.min(value, 100)) / 100;
  }

  /**
   * Gets the current volume level
   *
   * @returns Current volume (0-100)
   *
   * @example
   * ```
   * const currentVolume = tracker.getVolume(); // Returns 75
   * ```
   */
  getVolume(): number {
    return this.audio.volume * 100;
  }

  /**
   * Sets the playback speed
   *
   * @param rate - Playback rate (0.25-4.0, where 1.0 is normal speed)
   *
   * @example
   * ```
   * tracker.setPlaybackRate(1.5); // 1.5x speed
   * tracker.setPlaybackRate(0.5); // Half speed
   * ```
   */
  setPlaybackRate(rate: number): void {
    this.audio.playbackRate = Math.max(0.25, Math.min(rate, 4));
  }

  /**
   * Gets the current playback rate
   *
   * @returns Current playback rate
   */
  getPlaybackRate(): number {
    return this.audio.playbackRate;
  }

  /**
   * Toggles mute state
   *
   * @returns New mute state (true if muted)
   *
   * @example
   * ```
   * const isMuted = tracker.toggleMute();
   * ```
   */
  toggleMute(): boolean {
    this.audio.muted = !this.audio.muted;
    return this.audio.muted;
  }

  /**
   * Checks if audio is currently muted
   *
   * @returns True if muted
   */
  isMuted(): boolean {
    return this.audio.muted;
  }

  /**
   * Sets the mute state
   *
   * @param muted - True to mute, false to unmute
   *
   * @example
   * ```
   * tracker.setMuted(true); // Mute
   * tracker.setMuted(false); // Unmute
   * ```
   */
  setMuted(muted: boolean): void {
    this.audio.muted = Boolean(muted);
  }

  /**
   * Enables or disables audio looping
   *
   * @param loop - True to enable looping
   *
   * @example
   * ```
   * tracker.setLoop(true); // Enable loop
   * ```
   */
  setLoop(loop: boolean): void {
    this.audio.loop = Boolean(loop);
  }

  /**
   * Checks if audio is set to loop
   *
   * @returns True if looping is enabled
   */
  isLooping(): boolean {
    return this.audio.loop;
  }

  /**
   * Sets autoplay behavior
   *
   * @param autoplay - True to enable autoplay
   */
  setAutoplay(autoplay: boolean): void {
    this.audio.autoplay = Boolean(autoplay);
  }

  /**
   * Gets autoplay state
   *
   * @returns True if autoplay is enabled
   */
  getAutoplay(): boolean {
    return this.audio.autoplay;
  }

  /**
   * Sets CORS policy for audio loading
   *
   * @param crossOrigin - CORS setting ("anonymous" | "use-credentials")
   */
  setCrossOrigin(crossOrigin: string): void {
    this.audio.crossOrigin = crossOrigin;
  }

  /**
   * Gets current CORS policy
   *
   * @returns Current CORS setting
   */
  getCrossOrigin(): string | null {
    return this.audio.crossOrigin;
  }

  /**
   * Sets preload strategy
   *
   * @param preload - Preload strategy ("none" | "metadata" | "auto")
   */
  setPreload(preload: "none" | "metadata" | "auto"): void {
    this.audio.preload = preload;
  }

  /**
   * Gets current preload strategy
   *
   * @returns Current preload setting
   */
  getPreload(): string {
    return this.audio.preload;
  }

  /**
   * Gets the ready state of the audio
   *
   * @returns Ready state (0: HAVE_NOTHING to 4: HAVE_ENOUGH_DATA)
   */
  getReadyState(): number {
    return this.audio.readyState;
  }

  /**
   * Gets the network loading state
   *
   * @returns Network state (0: NETWORK_EMPTY to 3: NETWORK_NO_SOURCE)
   */
  getNetworkState(): number {
    return this.audio.networkState;
  }

  /**
   * Checks if audio is currently playing
   *
   * @returns True if playing
   *
   * @example
   * ```
   * if (tracker.isPlaying()) {
   *   console.log('Audio is playing');
   * }
   * ```
   */
  isPlaying(): boolean {
    return !this.audio.paused && !this.audio.ended && this.audio.readyState > 2;
  }

  /**
   * Gets total audio duration
   *
   * @returns Duration in seconds
   */
  getDuration(): number {
    return this.duration;
  }

  /**
   * Gets current playback position
   *
   * @returns Current time in seconds
   */
  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  /**
   * Gets remaining playback time
   *
   * @returns Remaining time in seconds
   *
   * @example
   * ```
   * const remaining = tracker.getTimeRemaining();
   * console.log(`${Math.floor(remaining)} seconds left`);
   * ```
   */
  getTimeRemaining(): number {
    return Math.max(0, this.duration - this.audio.currentTime);
  }

  /**
   * Configures Media Session API for system-level media controls
   * Enables integration with OS media controls, lock screen, and notifications
   * @private
   */
  private setupMediaSession(): void {
    if (!("mediaSession" in navigator)) {
      console.warn("Media Session API not supported");
      return;
    }

    this.mediaSessionEnabled = true;

    const { title, artist, album, artwork } = this.options.mediaSession!;

    // Set metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || "Unknown Title",
      artist: artist || "Unknown Artist",
      album: album || "Unknown Album",
      artwork: artwork || [],
    });

    // Define action handlers
    const actions: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      [
        "play",
        async (): Promise<void> => {
          await this.play();
          this.updatePlaybackState("playing");
        },
      ],
      [
        "pause",
        (): void => {
          this.pause();
          this.updatePlaybackState("paused");
        },
      ],
      [
        "seekbackward",
        (details: MediaSessionActionDetails): void => {
          this.backward(details.seekOffset || 10);
        },
      ],
      [
        "seekforward",
        (details: MediaSessionActionDetails): void => {
          this.forward(details.seekOffset || 10);
        },
      ],
      [
        "seekto",
        (details: MediaSessionActionDetails): void => {
          if (details.fastSeek && "fastSeek" in this.audio) {
            (this.audio as any).fastSeek(details.seekTime!);
          } else {
            this.audio.currentTime = details.seekTime!;
          }
          this.updatePositionState();
        },
      ],
      [
        "stop",
        (): void => {
          this.pause();
          this.audio.currentTime = 0;
          this.updatePlaybackState("paused");
        },
      ],
    ];

    // Register handlers
    for (const [action, handler] of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        console.warn(`Media Session action "${action}" not supported`);
      }
    }
  }

  /**
   * Cleans up event listeners and resources
   * Call this when the tracker is no longer needed to prevent memory leaks
   *
   * @example
   * ```
   * // When component unmounts or tracker is no longer needed
   * tracker.destroy();
   * ```
   */
  destroy(): void {
    if (this.cleanupFunction) {
      this.cleanupFunction();
    }

    if (!this.isExternalAudio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio.load();
    }
  }
}
