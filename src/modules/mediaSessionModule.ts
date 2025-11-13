import AudioTracker from "../index"; // Adjust the import path as needed

/**
 * Media Session API module for AudioTracker
 * Enables integration with the Media Session API for metadata and media controls.
 *
 * @param tracker - The AudioTracker instance
 * @returns A cleanup function to unregister Media Session handlers
 */
export function mediaSessionModule(tracker: AudioTracker): () => void {
  if (!("mediaSession" in navigator)) {
    console.warn("Media Session API not supported");
    return () => {};
  }

  // Update metadata initially if provided in tracker options
  if (tracker.options.mediaSession) {
    navigator.mediaSession.metadata = new MediaMetadata(
      tracker.options.mediaSession
    );
  }

  /** Update the Media Session playback state */
  function updatePlaybackState(state: MediaSessionPlaybackState) {
    try {
      navigator.mediaSession.playbackState = state;
    } catch (error) {
      console.warn("Failed to update Media Session playback state:", error);
    }
  }

  /** Update the Media Session position state */
  function updatePositionState() {
    if (tracker.getDuration() && !isNaN(tracker.getDuration())) {
      try {
        navigator.mediaSession.setPositionState?.({
          duration: tracker.getDuration(),
          playbackRate: tracker.getPlaybackRate(),
          position: tracker.getCurrentTime(),
        });
      } catch (error) {
        console.warn("Failed to update Media Session position:", error);
      }
    }
  }

  const actions: [
    MediaSessionAction,
    (details?: MediaSessionActionDetails) => void | Promise<void>
  ][] = [
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
      (details) => {
        tracker.backward(details?.seekOffset || 10);
      },
    ],
    [
      "seekforward",
      (details) => {
        tracker.forward(details?.seekOffset || 10);
      },
    ],
    [
      "seekto",
      (details) => {
        if (details?.fastSeek && "fastSeek" in tracker.getAudioElement()) {
          tracker.getAudioElement().fastSeek(details.seekTime!);
        } else {
          tracker.seekTo(details?.seekTime || 0);
        }
        updatePositionState();
      },
    ],
    [
      "stop",
      () => {
        tracker.pause();
        tracker.seekTo(0);
        updatePlaybackState("paused");
      },
    ],
  ];

  // Register Media Session action handlers
  for (const [action, handler] of actions) {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch (error) {
      console.warn(`Media Session action "${action}" not supported`);
    }
  }

  // Handlers for updating position and playback state on events
  const handleEnded = () => {
    updatePositionState();
    updatePlaybackState("paused");
  };

  const handlePlay = () => {
    updatePositionState();
    updatePlaybackState("playing");
  };

  const handlePause = () => {
    updatePositionState();
    updatePlaybackState("paused");
  };

  // Events to subscribe to on tracker for syncing Media Session state
  const subscriptions: [keyof HTMLMediaElementEventMap, () => void][] = [
    ["loadedmetadata", updatePositionState],
    ["seeked", updatePositionState],
    ["ratechange", updatePositionState],
    ["timeupdate", updatePositionState],
    ["ended", handleEnded],
    ["play", handlePlay],
    ["pause", handlePause],
  ];

  // Subscribe event handlers
  subscriptions.forEach(([event, handler]) =>
    tracker.subscribe(event, handler)
  );

  // Return cleanup function to unregister handlers and reset metadata
  return () => {
    actions.forEach(([action]) => {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch {}
    });

    subscriptions.forEach(([event, handler]) =>
      tracker.unsubscribe(event, handler)
    );

    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
  };
}
