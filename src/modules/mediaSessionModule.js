export function mediaSessionModule(tracker) {
  if (!("mediaSession" in navigator)) {
    console.warn("MediaSessionModule: Media Session API not supported");
    return () => {};
  }

  if (tracker.options.mediaSession) {
    navigator.mediaSession.metadata = new MediaMetadata(
      tracker.options.mediaSession,
    );
  }

  tracker.updateMediaSessionMetadata = (metadata) => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata(metadata);
    } catch (error) {
      console.warn("Failed to update MediaSession metadata:", error);
    }
  };

  // Update Media Session playback state
  function updatePlaybackState(state) {
    try {
      navigator.mediaSession.playbackState = state;
    } catch (error) {
      console.warn("Failed to update Media Session playback state:", error);
    }
  }

  // Update Media Session position
  function updatePositionState() {
    if (tracker.audio.duration && !isNaN(tracker.audio.duration)) {
      try {
        navigator.mediaSession.setPositionState({
          duration: tracker.audio.duration,
          playbackRate: tracker.audio.playbackRate,
          position: tracker.audio.currentTime,
        });
      } catch (error) {
        console.warn("Failed to update Media Session position:", error);
      }
    }
  }

  const actions = [
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
        tracker.backward(details.seekOffset || 10);
      },
    ],
    [
      "seekforward",
      (details) => {
        tracker.forward(details.seekOffset || 10);
      },
    ],
    [
      "seekto",
      (details) => {
        if (details.fastSeek && "fastSeek" in tracker.audio) {
          tracker.audio.fastSeek(details.seekTime);
        } else {
          tracker.audio.currentTime = details.seekTime;
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
    } catch (error) {
      console.warn(`Media Session action "${action}" not supported`);
    }
  }

  // Handlers for tracking playback and position state updates
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

  // Store subscriptions to unsubscribe later
  const subscriptions = [
    ["loadedmetadata", updatePositionState],
    ["seeked", updatePositionState],
    ["ratechange", updatePositionState],
    ["timeupdate", updatePositionState],
    ["ended", handleEnded],
    ["play", handlePlay],
    ["pause", handlePause],
  ];

  subscriptions.forEach(([event, handler]) =>
    tracker.subscribe(event, handler),
  );

  // Return cleanup function to clear handlers and metadata
  return () => {
    actions.forEach(([action]) => {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch {}
    });

    subscriptions.forEach(([event, handler]) =>
      tracker.unsubscribe(event, handler),
    );

    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
  };
}
