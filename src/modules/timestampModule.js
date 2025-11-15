export function timestampModule(tracker) {
  const segments = Array.isArray(tracker.options?.timestamp?.segments)
    ? tracker.options.timestamp.segments.map((seg) => ({
        ...seg,
        subSegments: Array.isArray(seg.subSegments) ? seg.subSegments : [],
      }))
    : [];

  const gapBehavior = tracker.options?.timestamp?.gapBehavior || null;

  if (!segments.length) {
    console.warn("TimestampModule: No segments provided or array is empty.");
    return () => {};
  }

  // Validate and sort segments by start time
  const validatedSegments = segments
    .filter((seg) => {
      if (typeof seg.start !== "number" || typeof seg.end !== "number") {
        console.warn("TimestampModule: Invalid segment detected", seg);
        return false;
      }
      if (seg.start >= seg.end) {
        console.warn("TimestampModule: Segment start >= end", seg);
        return false;
      }
      return true;
    })
    .sort((a, b) => a.start - b.start);

  if (validatedSegments.length === 0) {
    console.warn("TimestampModule: No valid segments after validation.");
    return () => {};
  }

  let currentSegmentIndex = -1;
  let currentSubSegmentIndex = -1;
  let currentSpeaker = null;
  let lastValidSegmentIndex = -1;
  let lastReportedSegment = null;
  let lastReportedSubSegment = null;
  let isInitialized = false;

  // Find segment index by playback time with boundary tolerance
  function findSegmentIndexByTime(time) {
    if (typeof time !== "number" || isNaN(time)) return -1;

    return validatedSegments.findIndex((seg) => {
      return time >= seg.start && time < seg.end;
    });
  }

  // Find subsegment index with validation
  function findSubSegmentIndexByTime(mainSegment, time) {
    if (!mainSegment?.subSegments?.length) return -1;
    if (typeof time !== "number" || isNaN(time)) return -1;

    return mainSegment.subSegments.findIndex(
      (seg) => time >= seg.start && time < seg.end,
    );
  }

  // Find previous segment for persist-previous behavior
  function findPreviousSegmentByTime(time) {
    if (typeof time !== "number" || isNaN(time)) return -1;

    for (let i = validatedSegments.length - 1; i >= 0; i--) {
      if (validatedSegments[i].end <= time) return i;
    }
    return -1;
  }

  // Find next segment for persist-next behavior
  function findNextSegmentByTime(time) {
    if (typeof time !== "number" || isNaN(time)) return -1;

    for (let i = 0; i < validatedSegments.length; i++) {
      if (validatedSegments[i].start >= time) return i;
    }
    return -1;
  }

  // Resolve segment based on gap behavior
  function getSegmentWithGapBehavior(segmentIndex, time) {
    // Direct segment match
    if (segmentIndex !== -1) {
      return validatedSegments[segmentIndex];
    }

    // In a gap - apply gap behavior
    if (gapBehavior === "persist-previous") {
      const prevIndex = findPreviousSegmentByTime(time);
      if (prevIndex !== -1) {
        lastValidSegmentIndex = prevIndex;
        return validatedSegments[prevIndex];
      }
      // Fallback to lastValidSegmentIndex if available
      return lastValidSegmentIndex !== -1
        ? validatedSegments[lastValidSegmentIndex]
        : null;
    } else if (gapBehavior === "persist-next") {
      const nextIndex = findNextSegmentByTime(time);
      return nextIndex !== -1 ? validatedSegments[nextIndex] : null;
    }

    return null;
  }

  // Get sub-segment with gap behavior
  function getSubSegmentWithGapBehavior(time) {
    if (currentSegmentIndex !== -1 && currentSubSegmentIndex !== -1) {
      return validatedSegments[currentSegmentIndex].subSegments[
        currentSubSegmentIndex
      ];
    }

    // Apply gap behavior for sub-segments
    if (gapBehavior === "persist-previous" && lastValidSegmentIndex !== -1) {
      const seg = validatedSegments[lastValidSegmentIndex];
      if (seg?.subSegments?.length) {
        return seg.subSegments[seg.subSegments.length - 1];
      }
    } else if (gapBehavior === "persist-next") {
      const nextIndex = findNextSegmentByTime(time);
      if (nextIndex !== -1) {
        const seg = validatedSegments[nextIndex];
        if (seg?.subSegments?.length) {
          return seg.subSegments[0];
        }
      }
    }

    return null;
  }

  // Main time update handler with robust state management
  function handleTimeUpdate() {
    const currentTime = tracker.getCurrentTime();

    if (
      typeof currentTime !== "number" ||
      isNaN(currentTime) ||
      currentTime < 0
    ) {
      return;
    }

    const newSegmentIndex = findSegmentIndexByTime(currentTime);
    const segmentToReport = getSegmentWithGapBehavior(
      newSegmentIndex,
      currentTime,
    );

    const segmentChanged =
      newSegmentIndex !== currentSegmentIndex ||
      !isInitialized ||
      lastReportedSegment?.id !== segmentToReport?.id;

    if (segmentChanged) {
      currentSegmentIndex = newSegmentIndex;

      if (currentSegmentIndex !== -1) {
        lastValidSegmentIndex = currentSegmentIndex;
      }

      if (segmentToReport !== null) {
        tracker.callbacks.onSegmentChange?.(segmentToReport);
        lastReportedSegment = segmentToReport;

        const newSpeaker = segmentToReport.speaker ?? null;
        if (currentSpeaker?.id !== newSpeaker?.id) {
          currentSpeaker = newSpeaker;
          tracker.callbacks.onSpeakerChange?.(currentSpeaker);
        }
      } else {
        tracker.callbacks.onSegmentChange?.(null);
        lastReportedSegment = null;

        if (currentSpeaker !== null) {
          currentSpeaker = null;
          tracker.callbacks.onSpeakerChange?.(null);
        }
      }
    }

    const subSegmentToReport = getSubSegmentWithGapBehavior(currentTime);

    if (currentSegmentIndex !== -1) {
      const currentSegment = validatedSegments[currentSegmentIndex];
      const newSubSegmentIndex = findSubSegmentIndexByTime(
        currentSegment,
        currentTime,
      );

      if (newSubSegmentIndex !== currentSubSegmentIndex) {
        currentSubSegmentIndex = newSubSegmentIndex;

        if (currentSubSegmentIndex !== -1 && currentSegment.subSegments) {
          const subSeg = currentSegment.subSegments[currentSubSegmentIndex];
          tracker.callbacks.onSubSegmentChange?.(subSeg);
          lastReportedSubSegment = subSeg;
        } else {
          tracker.callbacks.onSubSegmentChange?.(null);
          lastReportedSubSegment = null;
        }
      }
    } else {
      const subSegChanged =
        lastReportedSubSegment?.id !== subSegmentToReport?.id;

      if (subSegChanged) {
        if (subSegmentToReport !== null) {
          tracker.callbacks.onSubSegmentChange?.(subSegmentToReport);
          lastReportedSubSegment = subSegmentToReport;
        } else {
          if (currentSubSegmentIndex !== -1) {
            currentSubSegmentIndex = -1;
            tracker.callbacks.onSubSegmentChange?.(null);
            lastReportedSubSegment = null;
          }
        }
      }
    }

    isInitialized = true;
  }

  // Sync on seeking
  function handleSeeking() {
    currentSegmentIndex = -1;
    isInitialized = false;
    handleTimeUpdate();
  }

  // Initialize with first update
  handleTimeUpdate();

  // Public API methods
  tracker.getCurrentSegment = () => {
    const currentTime = tracker.getCurrentTime();
    if (currentSegmentIndex !== -1) {
      return validatedSegments[currentSegmentIndex];
    }
    return getSegmentWithGapBehavior(currentSegmentIndex, currentTime);
  };

  tracker.getCurrentSubSegment = () => {
    const currentTime = tracker.getCurrentTime();
    return getSubSegmentWithGapBehavior(currentTime);
  };

  tracker.getCurrentSpeaker = () => {
    const currentSeg = tracker.getCurrentSegment();
    return currentSeg?.speaker || null;
  };

  // Seek methods with validation
  tracker.seekToSegmentById = (id) => {
    if (!id) return;
    const segment = validatedSegments.find((seg) => seg.id === id);
    if (segment?.start != null) {
      const duration = tracker.getDuration();
      const seekTime = Math.min(Math.max(segment.start, 0), duration);
      tracker.seekTo(seekTime);
    }
  };

  tracker.seekToSubSegmentById = (id) => {
    if (!id) return;
    for (const segment of validatedSegments) {
      if (segment.subSegments?.length) {
        const sub = segment.subSegments.find((s) => s.id === id);
        if (sub?.start != null) {
          const duration = tracker.getDuration();
          const seekTime = Math.min(Math.max(sub.start, 0), duration);
          tracker.seekTo(seekTime);
          return;
        }
      }
    }
  };

  // Subscribe to events
  tracker.subscribe("timeupdate", handleTimeUpdate);
  tracker.subscribe("seeking", handleSeeking);

  // Cleanup function
  return () => {
    tracker.unsubscribe("timeupdate", handleTimeUpdate);
    tracker.unsubscribe("seeking", handleSeeking);
  };
}
