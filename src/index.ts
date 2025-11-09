interface AudioTrackerCallbacks {
  onDurationChange?: (duration: number) => void;
  onBufferChange?: (bufferedTime: number) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onRateChange?: (rate: number) => void;
  onVolumeChange?: (volume: { volume: number; muted: boolean }) => void;
  onWaiting?: () => void;
  onPlaying?: () => void;
  onSeeking?: (time: number) => void;
  onCanPlay?: () => void;
  onLoadStart?: () => void;
  onError?: (error: MediaError | null) => void;
}

interface AudioTrackerOptions {
  preload?: "none" | "metadata" | "auto";
  mediaSession?: {
    title?: string;
    artist?: string;
    album?: string;
    artwork?: Array<{
      src: string;
      sizes: string;
      type: string;
    }>;
  };
}

export default class AudioTracker {
  private audio: HTMLAudioElement;
  private isExternalAudio: boolean;
  private options: AudioTrackerOptions;
  private listeners: AudioTrackerCallbacks;
  private mediaSessionEnabled: boolean;
  private cleanup: (() => void) | null;

  constructor(
    audioSource: string | HTMLAudioElement,
    options: AudioTrackerOptions = {}
  ) {
    // Check if audioSource is an HTMLAudioElement or a string URL
    if (audioSource instanceof HTMLAudioElement) {
      this.audio = audioSource;
      this.isExternalAudio = true;
    } else if (typeof audioSource === "string") {
      this.audio = new Audio(audioSource);
      this.audio.preload = options.preload || "metadata";
      this.isExternalAudio = false;
    } else {
      throw new Error(
        "AudioTracker: audioSource must be either a string URL or HTMLAudioElement"
      );
    }

    this.options = options;
    this.listeners = {};
    this.mediaSessionEnabled = false;
    this.cleanup = null;
  }

  // Initialize the tracker with event listeners and callbacks
  init(callbacks: AudioTrackerCallbacks): void {
    this.listeners = callbacks;

    // Fired when audio duration becomes available
    const handleLoadedMetadata = (): void => {
      if (this.listeners.onDurationChange) {
        this.listeners.onDurationChange(this.audio.duration);
      }
      this.updateBuffer();
      this.updatePositionState();
    };

    // Fired when browser downloads more audio data
    const handleProgress = (): void => {
      this.updateBuffer();
    };

    // Fired continuously as audio plays (tracks current position)
    const handleTimeUpdate = (): void => {
      if (this.listeners.onTimeUpdate) {
        this.listeners.onTimeUpdate(this.audio.currentTime);
      }
    };

    // Fired after any seek operation completes
    const handleSeeked = (): void => {
      this.updatePositionState();
    };

    // Fired when playback speed changes
    const handleRateChange = (): void => {
      this.updatePositionState();
      if (this.listeners.onRateChange) {
        this.listeners.onRateChange(this.audio.playbackRate);
      }
    };

    // Fired when audio finishes playing
    const handleEnded = (): void => {
      this.updatePositionState();
      this.updatePlaybackState("paused");
      if (this.listeners.onEnded) {
        this.listeners.onEnded();
      }
    };

    // Fired when audio starts playing
    const handlePlay = (): void => {
      this.updatePositionState();
      this.updatePlaybackState("playing");
      if (this.listeners.onPlay) {
        this.listeners.onPlay();
      }
    };

    // Fired when audio pauses
    const handlePause = (): void => {
      this.updatePositionState();
      this.updatePlaybackState("paused");
      if (this.listeners.onPause) {
        this.listeners.onPause();
      }
    };

    // Fired when volume or mute state changes
    const handleVolumeChange = (): void => {
      if (this.listeners.onVolumeChange) {
        this.listeners.onVolumeChange({
          volume: this.audio.volume * 100,
          muted: this.audio.muted,
        });
      }
    };

    // Fired when playback stops due to buffering
    const handleWaiting = (): void => {
      if (this.listeners.onWaiting) {
        this.listeners.onWaiting();
      }
    };

    // Fired when playback is ready to start after pause/buffering
    const handlePlaying = (): void => {
      if (this.listeners.onPlaying) {
        this.listeners.onPlaying();
      }
    };

    // Fired when seeking starts
    const handleSeeking = (): void => {
      if (this.listeners.onSeeking) {
        this.listeners.onSeeking(this.audio.currentTime);
      }
    };

    // Fired when enough data is available to start playing
    const handleCanPlay = (): void => {
      if (this.listeners.onCanPlay) {
        this.listeners.onCanPlay();
      }
    };

    // Fired when browser starts loading the resource
    const handleLoadStart = (): void => {
      if (this.listeners.onLoadStart) {
        this.listeners.onLoadStart();
      }
    };

    // Fired when an error occurs
    const handleError = (): void => {
      if (this.listeners.onError) {
        this.listeners.onError(this.audio.error);
      }
    };

    // Check if audio metadata is already loaded
    if (this.audio.readyState >= 1) {
      if (this.listeners.onDurationChange) {
        this.listeners.onDurationChange(this.audio.duration);
      }
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
    this.audio.addEventListener("error", handleError);

    // Setup Media Session if metadata provided
    if (this.options.mediaSession) {
      this.setupMediaSession();
    }

    // Store cleanup function to remove listeners later
    this.cleanup = (): void => {
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
      this.audio.removeEventListener("error", handleError);
    };
  }

  // Calculate and notify how much audio has been buffered
  private updateBuffer(): void {
    if (this.audio.buffered.length > 0) {
      const bufferEnd = this.audio.buffered.end(this.audio.buffered.length - 1);
      if (this.listeners.onBufferChange) {
        this.listeners.onBufferChange(bufferEnd);
      }
    }
  }

  // Sync Media Session with current audio position
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
        console.log("Failed to update position state:", error);
      }
    }
  }

  // Update Media Session playback state (playing or paused)
  private updatePlaybackState(state: "none" | "paused" | "playing"): void {
    if (!this.mediaSessionEnabled || !("mediaSession" in navigator)) {
      return;
    }

    try {
      navigator.mediaSession.playbackState = state;
    } catch (error) {
      console.log("Failed to update playback state:", error);
    }
  }

  // Convert seconds to MM:SS format
  calculateTime(secs: number): string {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutes}:${returnedSeconds}`;
  }

  // Start playing audio
  play(): Promise<void> {
    return this.audio.play();
  }

  // Pause audio playback
  pause(): void {
    this.audio.pause();
  }

  // Jump to specific time in audio
  seekTo(time: number): void {
    this.audio.currentTime = time;
  }

  // Set volume level (0-100 scale)
  setVolume(value: number /* 0–100 */): void {
    this.audio.volume = value / 100;
  }

  // Get current volume (0-100 scale)
  getVolume(): number {
    return this.audio.volume * 100;
  }

  // Set playback speed (0.5 = half speed, 1 = normal, 2 = double speed)
  setPlaybackRate(rate: number): void {
    this.audio.playbackRate = rate;
  }

  // Get current playback speed
  getPlaybackRate(): number {
    return this.audio.playbackRate;
  }

  // Toggle mute on/off and return new state
  toggleMute(): boolean {
    this.audio.muted = !this.audio.muted;
    return this.audio.muted;
  }

  // Check if audio is currently muted
  isMuted(): boolean {
    return this.audio.muted;
  }

  // Set mute state directly
  setMuted(muted: boolean): void {
    this.audio.muted = muted;
  }

  // Enable or disable looping
  setLoop(loop: boolean): void {
    this.audio.loop = loop;
  }

  // Get loop state
  isLooping(): boolean {
    return this.audio.loop;
  }

  // Get current ready state (loading status)
  getReadyState(): number {
    return this.audio.readyState;
  }

  // Get network state (loading status)
  getNetworkState(): number {
    return this.audio.networkState;
  }

  // Check if audio is currently playing
  isPlaying(): boolean {
    return !this.audio.paused && !this.audio.ended && this.audio.readyState > 2;
  }

  // Configure Media Session API for lock screen controls
  private setupMediaSession(): void {
    if (!("mediaSession" in navigator)) {
      console.log("Media Session API not supported");
      return;
    }

    this.mediaSessionEnabled = true;

    const { title, artist, album, artwork } = this.options.mediaSession!;

    // Set track information displayed on lock screen
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || "Unknown Title",
      artist: artist || "Unknown Artist",
      album: album || "Unknown Album",
      artwork: artwork || [],
    });

    // Define handlers for media control buttons
    const actionsAndHandlers: Array<
      [MediaSessionAction, MediaSessionActionHandler]
    > = [
      [
        "play",
        async () => {
          await this.play();
          this.updatePlaybackState("playing");
        },
      ],
      [
        "pause",
        () => {
          this.pause();
          this.updatePlaybackState("paused");
        },
      ],
      [
        "seekbackward",
        (details: MediaSessionActionDetails) => {
          // Jump back 10 seconds (or custom offset)
          this.audio.currentTime = Math.max(
            this.audio.currentTime - (details.seekOffset || 10),
            0
          );
        },
      ],
      [
        "seekforward",
        (details: MediaSessionActionDetails) => {
          // Jump forward 10 seconds (or custom offset)
          this.audio.currentTime = Math.min(
            this.audio.currentTime + (details.seekOffset || 10),
            this.audio.duration
          );
        },
      ],
      [
        "seekto",
        (details) => {
          // Seek to exact position from lock screen scrubber
          if (details.fastSeek && "fastSeek" in this.audio) {
            (this.audio as any).fastSeek(details.seekTime!);
          } else {
            this.audio.currentTime = details.seekTime!;
          }
        },
      ],
      [
        "stop",
        () => {
          // Stop playback and reset to beginning
          this.pause();
          this.audio.currentTime = 0;
          this.updatePlaybackState("paused");
        },
      ],
    ];

    // Register each action handler with Media Session
    for (const [action, handler] of actionsAndHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        console.log(`Media session action "${action}" is not supported`);
      }
    }
  }

  // Remove all event listeners before destroying
  destroy(): void {
    if (this.cleanup) {
      this.cleanup();
    }
    // Only clear audio if it was created internally
    if (!this.isExternalAudio) {
      this.audio.pause();
      this.audio.src = "";
    }
  }
}
