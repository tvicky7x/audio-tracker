/**
 * Media Session module configuration options
 */
interface MediaSessionOptions {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: MediaImage[];
}

/**
 * Extended AudioTracker interface with Media Session module methods
 */
interface AudioTrackerWithMediaSession {
  audio: HTMLAudioElement;
  options: {
    mediaSession?: MediaSessionOptions;
  };
  play: () => Promise<void>;
  pause: () => void;
  forward: (seconds?: number) => void;
  backward: (seconds?: number) => void;
  subscribe: (event: string, handler: () => void) => void;
  unsubscribe: (event: string, handler: () => void) => void;
  updateMediaSessionMetadata?: (metadata: MediaMetadataInit) => void;
}

/**
 * Media Session module for AudioTracker
 * Integrates with the browser's Media Session API to display playback controls in system UI
 * @param tracker - AudioTracker instance to attach Media Session functionality
 * @returns Cleanup function to remove Media Session handlers and metadata
 * @example
 * const tracker = new AudioTracker('audio.mp3', {
 *   mediaSession: {
 *     title: 'Song Title',
 *     artist: 'Artist Name',
 *     album: 'Album Name',
 *     artwork: [{ src: 'cover.jpg', sizes: '512x512', type: 'image/jpeg' }]
 *   }
 * });
 * tracker.use(mediaSessionModule);
 */
export function mediaSessionModule(
  tracker: AudioTrackerWithMediaSession
): (() => void) | void {
  if (!("mediaSession" in navigator)) {
    console.warn("MediaSessionModule: Media Session API not supported");
    return () => {};
  }

  if (tracker.options.mediaSession) {
    navigator.mediaSession.metadata = new MediaMetadata(
      tracker.options.mediaSession
    );
  }

  /**
   * Update Media Session metadata dynamically
   * @param metadata - New metadata to display in system UI
   * @example
   * tracker.updateMediaSessionMetadata({
   *   title: 'New Song',
   *   artist: 'New Artist',
   *   artwork: [{ src: 'new-cover.jpg' }]
   * });
   */
  tracker.updateMediaSessionMetadata = (metadata: MediaMetadataInit): void => {
    try {
      navigator.mediaSession.metadata = new MediaMetadata(metadata);
    } catch (error) {
      console.warn("Failed to update MediaSession metadata:", error);
    }
  };

  function updatePlaybackState(state: MediaSessionPlaybackState): void {
    try {
      navigator.mediaSession.playbackState = state;
    } catch (error) {
      console.warn("Failed to update Media Session playback state:", error);
    }
  }

  function updatePositionState(): void {
    const { duration, playbackRate, currentTime } = tracker.audio;
    if (duration && !isNaN(duration)) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate,
          position: currentTime,
        });
      } catch (error) {
        console.warn("Failed to update Media Session position:", error);
      }
    }
  }

  const actions: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
    [
      "play",
      async () => {
        await tracker.play();
        updatePlaybackState("playing");
      },
    ],
    [
      "pause",
      () => {
        tracker.pause();
        updatePlaybackState("paused");
      },
    ],
    [
      "seekbackward",
      (details: MediaSessionActionDetails) => {
        tracker.backward(details.seekOffset || 10);
      },
    ],
    [
      "seekforward",
      (details: MediaSessionActionDetails) => {
        tracker.forward(details.seekOffset || 10);
      },
    ],
    [
      "seekto",
      (details: MediaSessionActionDetails) => {
        if (details.fastSeek && "fastSeek" in tracker.audio) {
          (tracker.audio as any).fastSeek(details.seekTime);
        } else {
          tracker.audio.currentTime = details.seekTime ?? 0;
        }
        updatePositionState();
      },
    ],
    [
      "stop",
      () => {
        tracker.pause();
        tracker.audio.currentTime = 0;
        updatePlaybackState("paused");
      },
    ],
  ];

  // Register handlers
  for (const [action, handler] of actions) {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      console.warn(`Media Session action "${action}" not supported`);
    }
  }

  // Playback event handlers
  const handleEnded = (): void => {
    updatePositionState();
    updatePlaybackState("paused");
  };
  const handlePlay = (): void => {
    updatePositionState();
    updatePlaybackState("playing");
  };
  const handlePause = (): void => {
    updatePositionState();
    updatePlaybackState("paused");
  };

  const subscriptions: Array<[string, () => void]> = [
    ["loadedmetadata", updatePositionState],
    ["seeked", updatePositionState],
    ["ratechange", updatePositionState],
    ["timeupdate", updatePositionState],
    ["ended", handleEnded],
    ["play", handlePlay],
    ["pause", handlePause],
  ];

  subscriptions.forEach(([event, handler]) =>
    tracker.subscribe(event, handler)
  );

  return (): void => {
    actions.forEach(([action]) => {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch {
        // optionally log or ignore
      }
    });

    subscriptions.forEach(([event, handler]) =>
      tracker.unsubscribe(event, handler)
    );

    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
  };
}
