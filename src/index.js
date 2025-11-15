export { mediaSessionModule } from "./modules/mediaSessionModule.js";
export { timestampModule } from "./modules/timestampModule.js";

export default class AudioTracker {
  constructor(audioSource, options = {}) {
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

  subscribe(eventName, callback) {
    if (!this.subscribers[eventName]) {
      this.subscribers[eventName] = [];
      this._attachDOMListener(eventName);
    }
    this.subscribers[eventName].push(callback);
  }

  unsubscribe(eventName, callback) {
    if (!this.subscribers[eventName]) return;
    this.subscribers[eventName] = this.subscribers[eventName].filter(
      (cb) => cb !== callback
    );

    if (this.subscribers[eventName].length === 0) {
      this._detachDOMListener(eventName);
      delete this.subscribers[eventName];
    }
  }

  _attachDOMListener(eventName) {
    if (this.boundHandlers[eventName]) {
      return;
    }
    const handler = (event) => {
      if (this.subscribers[eventName]) {
        this.subscribers[eventName].forEach((callback) => callback(event));
      }
    };
    this.boundHandlers[eventName] = handler;
    this.audio.addEventListener(eventName, handler);
  }

  _detachDOMListener(eventName) {
    if (this.boundHandlers[eventName]) {
      this.audio.removeEventListener(eventName, this.boundHandlers[eventName]);
      delete this.boundHandlers[eventName];
    }
  }

  // ============================================
  // Initialization with callbacks
  // ============================================

  init(callbacks = {}) {
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

  updateBuffer() {
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

  use(module) {
    const cleanup = module(this);

    if (typeof cleanup === "function") {
      this.cleanupFunctions.push(cleanup);
    }

    return this;
  }

  // ============================================
  // Controls
  // ============================================

  play() {
    return this.audio.play().catch((e) => {
      console.warn("Playback failed:", e);
    });
  }

  pause() {
    this.audio.pause();
  }

  seekTo(time) {
    const duration = this.duration || this.audio.duration || 0;
    this.audio.currentTime = Math.max(0, Math.min(time, duration));
  }

  forward(seconds = 10) {
    const newTime = Math.min(this.audio.currentTime + seconds, this.duration);
    this.audio.currentTime = newTime;
  }

  backward(seconds = 10) {
    const newTime = Math.max(this.audio.currentTime - seconds, 0);
    this.audio.currentTime = newTime;
  }

  setVolume(value) {
    if (typeof value === "number") {
      const clampedValue = Math.max(0, Math.min(value, 100));
      this.audio.volume = clampedValue / 100;
    }
  }

  getVolume() {
    return this.audio.volume * 100;
  }

  setMuted(muted) {
    this.audio.muted = Boolean(muted);
  }

  toggleMute() {
    this.audio.muted = !this.audio.muted;
    this.callbacks.onMuteChange?.(this.audio.muted);

    return this.audio.muted;
  }

  isMuted() {
    return this.audio.muted;
  }

  setPlaybackRate(rate) {
    this.audio.playbackRate = rate;
  }

  getPlaybackRate() {
    return this.audio.playbackRate;
  }

  setLoop(loop) {
    this.audio.loop = Boolean(loop);
  }

  isLooping() {
    return this.audio.loop;
  }

  setAutoplay(autoplay) {
    this.audio.autoplay = Boolean(autoplay);
  }

  getAutoplay() {
    return this.audio.autoplay;
  }

  setCrossOrigin(crossOrigin) {
    this.audio.crossOrigin = crossOrigin;
  }

  getCrossOrigin() {
    return this.audio.crossOrigin;
  }

  setPreload(preload) {
    this.audio.preload = preload;
  }

  getPreload() {
    return this.audio.preload;
  }

  getReadyState() {
    return this.audio.readyState;
  }

  getNetworkState() {
    return this.audio.networkState;
  }

  isPlaying() {
    return !this.audio.paused && !this.audio.ended && this.audio.readyState > 2;
  }

  getDuration() {
    return this.duration;
  }

  getCurrentTime() {
    return this.audio.currentTime;
  }

  getTimeRemaining() {
    return Math.max(0, this.duration - this.audio.currentTime);
  }

  // ============================================
  // Utilities
  // ============================================

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  getAudioElement() {
    return this.audio;
  }

  // ============================================
  // Cleanup
  // ============================================

  destroy() {
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
