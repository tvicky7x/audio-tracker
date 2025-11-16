export function timestampModule(tracker) {
  // Normalize segments from options, ensuring order and subSegments are set
  const segments = Array.isArray(tracker.options?.timestamp?.segments)
    ? tracker.options.timestamp.segments.map((seg, index) => ({
        ...seg,
        subSegments: Array.isArray(seg.subSegments) ? seg.subSegments : [],
      }))
    : [];

  // Store gap behavior option
  const gapBehavior = tracker.options?.timestamp?.gapBehavior || null;

  // Warn and exit if no segments to work with
  if (!segments.length) {
    console.warn("TimestampModule: No segments provided or array is empty.");
    return () => {};
  }

  // Validate segments and sort by start time
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

  // Mutable state trackers
  let currentSegmentIndex = -1;
  let currentSubSegmentIndex = -1;
  let currentSpeaker = null;
  let lastValidSegmentIndex = -1;
  let lastReportedSegment = null;
  let lastReportedSubSegment = null;
  let isInitialized = false;

  // Returns index of segment for time or -1 if not found
  function findSegmentIndexByTime(time) {
    if (typeof time !== "number" || isNaN(time)) return -1;
    return validatedSegments.findIndex(
      (seg) => time >= seg.start && time < seg.end
    );
  }

  // Returns subsegment index for time within main segment
  function findSubSegmentIndexByTime(mainSegment, time) {
    if (!mainSegment?.subSegments?.length) return -1;
    if (typeof time !== "number" || isNaN(time)) return -1;
    return mainSegment.subSegments.findIndex(
      (seg) => time >= seg.start && time < seg.end
    );
  }

  // Finds previous segment index based on playback time
  function findPreviousSegmentByTime(time) {
    if (typeof time !== "number" || isNaN(time)) return -1;
    for (let i = validatedSegments.length - 1; i >= 0; i--)
      if (validatedSegments[i].end <= time) return i;
    return -1;
  }

  // Finds next segment index based on playback time
  function findNextSegmentByTime(time) {
    if (typeof time !== "number" || isNaN(time)) return -1;
    for (let i = 0; i < validatedSegments.length; i++)
      if (validatedSegments[i].start >= time) return i;
    return -1;
  }

  // Returns segment by index/time, applying gap behavior if needed
  function getSegmentWithGapBehavior(segmentIndex, time) {
    if (segmentIndex !== -1) return validatedSegments[segmentIndex];
    if (gapBehavior === "persist-previous") {
      const prevIndex = findPreviousSegmentByTime(time);
      if (prevIndex !== -1) {
        lastValidSegmentIndex = prevIndex;
        return validatedSegments[prevIndex];
      }
      return lastValidSegmentIndex !== -1
        ? validatedSegments[lastValidSegmentIndex]
        : null;
    } else if (gapBehavior === "persist-next") {
      const nextIndex = findNextSegmentByTime(time);
      return nextIndex !== -1 ? validatedSegments[nextIndex] : null;
    }
    return null;
  }

  // Returns subsegment by gap behavior or current index
  function getSubSegmentWithGapBehavior(time) {
    if (currentSegmentIndex !== -1 && currentSubSegmentIndex !== -1) {
      return validatedSegments[currentSegmentIndex].subSegments[
        currentSubSegmentIndex
      ];
    }
    if (gapBehavior === "persist-previous" && lastValidSegmentIndex !== -1) {
      const seg = validatedSegments[lastValidSegmentIndex];
      if (seg?.subSegments?.length)
        return seg.subSegments[seg.subSegments.length - 1];
    } else if (gapBehavior === "persist-next") {
      const nextIndex = findNextSegmentByTime(time);
      if (nextIndex !== -1) {
        const seg = validatedSegments[nextIndex];
        if (seg?.subSegments?.length) return seg.subSegments[0];
      }
    }
    return null;
  }

  // Handles updating segment/subsegment state as playback time changes
  function handleTimeUpdate() {
    const currentTime = tracker.getCurrentTime();
    if (
      typeof currentTime !== "number" ||
      isNaN(currentTime) ||
      currentTime < 0
    )
      return;

    const newSegmentIndex = findSegmentIndexByTime(currentTime);
    const segmentToReport = getSegmentWithGapBehavior(
      newSegmentIndex,
      currentTime
    );
    const segmentChanged =
      newSegmentIndex !== currentSegmentIndex ||
      !isInitialized ||
      lastReportedSegment?.id !== segmentToReport?.id;

    if (segmentChanged) {
      // Fires when leaving a previous segment
      if (lastReportedSegment !== null)
        tracker.callbacks.onSegmentExit?.(lastReportedSegment);
      currentSegmentIndex = newSegmentIndex;
      if (currentSegmentIndex !== -1)
        lastValidSegmentIndex = currentSegmentIndex;
      if (segmentToReport !== null) {
        tracker.callbacks.onSegmentChange?.(segmentToReport); // Fires on segment change
        tracker.callbacks.onSegmentEnter?.(segmentToReport); // Fires on segment enter
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
        currentTime
      );

      if (newSubSegmentIndex !== currentSubSegmentIndex) {
        // Fires when leaving a subsegment
        if (lastReportedSubSegment !== null)
          tracker.callbacks.onSubSegmentExit?.(lastReportedSubSegment);
        currentSubSegmentIndex = newSubSegmentIndex;
        if (currentSubSegmentIndex !== -1 && currentSegment.subSegments) {
          const subSeg = currentSegment.subSegments[currentSubSegmentIndex];
          tracker.callbacks.onSubSegmentChange?.(subSeg); // Fires on subsegment change
          tracker.callbacks.onSubSegmentEnter?.(subSeg); // Fires on subsegment enter
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

  // Resets state after user seeks
  function handleSeeking() {
    currentSegmentIndex = -1;
    isInitialized = false;
    handleTimeUpdate();
  }

  // Fire initial time update on startup
  handleTimeUpdate();

  // Returns all validated segments for inspection
  tracker.getAllSegments = () => validatedSegments;

  // Returns subsegments array for segment by ID
  tracker.getSubSegmentsBySegmentId = (id) => {
    const segment = validatedSegments.find((seg) => seg.id === id);
    return segment?.subSegments || [];
  };

  // Returns the next segment after current or null
  tracker.getNextSegment = () => {
    if (currentSegmentIndex === -1) return null;
    return validatedSegments[currentSegmentIndex + 1] || null;
  };

  // Returns the previous segment before current or null
  tracker.getPreviousSegment = () => {
    if (currentSegmentIndex <= 0) return null;
    return validatedSegments[currentSegmentIndex - 1] || null;
  };

  // Seeks playback to the start of next segment
  tracker.seekToNextSegment = () => {
    const nextSegment = tracker.getNextSegment();
    if (nextSegment?.start != null) {
      const duration = tracker.getDuration();
      const seekTime = Math.min(Math.max(nextSegment.start, 0), duration);
      tracker.seekTo(seekTime);
    }
  };

  // Seeks playback to the start of previous segment
  tracker.seekToPreviousSegment = () => {
    const prevSegment = tracker.getPreviousSegment();
    if (prevSegment?.start != null) {
      const duration = tracker.getDuration();
      const seekTime = Math.min(Math.max(prevSegment.start, 0), duration);
      tracker.seekTo(seekTime);
    }
  };

  // Returns true if current time is in a gap between segments
  tracker.isInGap = () => {
    const currentTime = tracker.getCurrentTime();
    return findSegmentIndexByTime(currentTime) === -1;
  };

  // Returns the configured gap behavior string
  tracker.getGapBehavior = () => gapBehavior;

  // Returns segment for arbitrary playback time, respects gap behavior
  tracker.getSegmentAtTime = (time) => {
    if (typeof time !== "number" || isNaN(time)) return null;
    const segIndex = findSegmentIndexByTime(time);
    return getSegmentWithGapBehavior(segIndex, time);
  };

  // Returns subsegment for arbitrary playback time, respects gap behavior
  tracker.getSubSegmentAtTime = (time) => {
    if (typeof time !== "number" || isNaN(time)) return null;
    const segAtTime = tracker.getSegmentAtTime(time);
    if (!segAtTime) return null;
    const subIndex = findSubSegmentIndexByTime(segAtTime, time);
    if (subIndex !== -1) return segAtTime.subSegments[subIndex] || null;
    if (gapBehavior === "persist-previous" && segAtTime?.subSegments?.length) {
      return segAtTime.subSegments[segAtTime.subSegments.length - 1];
    } else if (gapBehavior === "persist-next") {
      return segAtTime.subSegments[0] || null;
    }
    return null;
  };

  // Standard API: segment & subsegment getters/setters/seeking (unchanged)
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

  // Subscribe to playback events
  tracker.subscribe("timeupdate", handleTimeUpdate);
  tracker.subscribe("seeking", handleSeeking);

  // Unsubscribe handler for cleanup
  return () => {
    tracker.unsubscribe("timeupdate", handleTimeUpdate);
    tracker.unsubscribe("seeking", handleSeeking);
  };
}
