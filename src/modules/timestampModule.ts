/**
 * Speaker information in a segment
 */
interface Speaker {
  id: string;
  name?: string;
}

/**
 * Sub-segment of a timestamp segment
 */
interface SubSegment {
  id: string;
  start: number;
  end: number;
  order?: number;
  text?: string;
}

/**
 * Segment representing a time range in audio with optional speaker and sub-segments
 */
interface Segment {
  id: string;
  start: number;
  end: number;
  order?: number;
  speaker?: Speaker | null;
  label?: string;
  text?: string;
  subSegments?: SubSegment[];
}

/**
 * Options defining segment list and gap behavior for timestamps
 */
interface TimestampOptions {
  segments?: Segment[];
  gapBehavior?: "persist-previous" | "persist-next" | null;
}

/**
 * Extended AudioTracker interface with timestamp module functionality
 */
interface AudioTrackerWithTimestamp {
  options: {
    timestamp?: TimestampOptions;
  };
  callbacks: {
    onSegmentChange?: (segment: Segment | null) => void;
    onSubSegmentChange?: (subSegment: SubSegment | null) => void;
    onSpeakerChange?: (speaker: Speaker | null) => void;
    onLabelChange?: (label: string | null) => void;
  };
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (time: number) => void;
  subscribe: (event: string, callback: () => void) => void;
  unsubscribe: (event: string, callback: () => void) => void;

  // Added dynamically by this module:
  getCurrentSegment?: () => Segment | null;
  getCurrentSubSegment?: () => SubSegment | null;
  getCurrentSpeaker?: () => Speaker | null;
  seekToSegmentById?: (id: string) => void;
  seekToSegmentByLabel?: (label: string) => void;
  seekToSegmentByOrder?: (order: number) => void;
  seekToSubSegmentById?: (id: string) => void;
}

/**
 * Timestamp module for AudioTracker that tracks audio segments and subsegments in real time.
 * Fires callbacks on segment, subsegment, and speaker changes based on playback time.
 *
 * @param tracker - AudioTracker instance with timestamp options
 * @returns Cleanup function that unsubscribes from events
 *
 * @example
 * // Example timestamp structure passed during AudioTracker construction:
 * const timestampData = {
 *   segments: [
 *     {
 *       id: 'seg1',
 *       start: 0,
 *       end: 30,
 *       order: 1,
 *       speaker: { id: 'sp1', name: 'Speaker 1' },
 *       label: 'Intro',
 *       text: 'hi everyone'
 *       subSegments: [
 *         { id: 'sub1', start: 0, end: 10, order: 1, text: 'hi' },
 *         { id: 'sub2', start: 10, end: 30, order: 2, text: 'everyone' },
 *       ],
 *     },
 *     {
 *       id: 'seg2',
 *       start: 30,
 *       end: 60,
 *       order: 2,
 *       label: 'Main section',
 *       text: 'welcome to todays podcast...'
 *     },
 *   ],
 *   gapBehavior: 'persist-previous', // Optional gap behavior
 * };
 *
 * const tracker = new AudioTracker('audio.mp3', { timestamp: timestampData });
 * tracker.use(timestampModule);
 */
export function timestampModule(
  tracker: AudioTrackerWithTimestamp
): () => void {
  const segments = Array.isArray(tracker.options?.timestamp?.segments)
    ? tracker.options.timestamp.segments.map((seg, index) => ({
        ...seg,
        order: seg.order ?? index + 1,
        subSegments: Array.isArray(seg.subSegments) ? seg.subSegments : [],
      }))
    : [];

  const gapBehavior = tracker.options?.timestamp?.gapBehavior || null;

  if (!segments.length) {
    console.warn("TimestampModule: No segments provided or array is empty.");
    return () => {};
  }

  const validatedSegments = segments
    .filter((seg) => {
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
  let currentSpeaker: Speaker | null = null;
  let lastValidSegmentIndex = -1;
  let lastReportedSegment: Segment | null = null;
  let lastReportedSubSegment: SubSegment | null = null;
  let lastReportedLabel: string | null = null;
  let isInitialized = false;

  function findSegmentIndexByTime(time: number): number {
    return validatedSegments.findIndex(
      (seg) => time >= seg.start && time < seg.end
    );
  }

  function findSubSegmentIndexByTime(segment: Segment, time: number): number {
    if (!segment.subSegments?.length) return -1;
    return segment.subSegments.findIndex(
      (sub) => time >= sub.start && time < sub.end
    );
  }

  function findPreviousSegmentByTime(time: number): number {
    for (let i = validatedSegments.length - 1; i >= 0; i--) {
      if (validatedSegments[i].end <= time) return i;
    }
    return -1;
  }

  function findNextSegmentByTime(time: number): number {
    for (let i = 0; i < validatedSegments.length; i++) {
      if (validatedSegments[i].start >= time) return i;
    }
    return -1;
  }

  function getSegmentWithGapBehavior(
    segmentIndex: number,
    time: number
  ): Segment | null {
    if (segmentIndex !== -1) {
      return validatedSegments[segmentIndex];
    }

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

  function getSubSegmentWithGapBehavior(time: number): SubSegment | null {
    if (currentSegmentIndex !== -1 && currentSubSegmentIndex !== -1) {
      return (
        validatedSegments[currentSegmentIndex].subSegments?.[
          currentSubSegmentIndex
        ] ?? null
      );
    }

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

  function handleTimeUpdate(): void {
    const currentTime = tracker.getCurrentTime();

    if (currentTime < 0) {
      return;
    }

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
      currentSegmentIndex = newSegmentIndex;

      if (currentSegmentIndex !== -1) {
        lastValidSegmentIndex = currentSegmentIndex;
      }

      if (segmentToReport !== null) {
        tracker.callbacks.onSegmentChange?.(segmentToReport);
        lastReportedSegment = segmentToReport;

        const newSpeaker = segmentToReport.speaker ?? null;
        const speakerChanged =
          (currentSpeaker === null && newSpeaker !== null) ||
          (currentSpeaker !== null && newSpeaker === null) ||
          currentSpeaker?.id !== newSpeaker?.id;
        if (speakerChanged) {
          currentSpeaker = newSpeaker;
          tracker.callbacks.onSpeakerChange?.(currentSpeaker);
        }

        const newLabel = segmentToReport.label ?? null;
        if (lastReportedLabel !== newLabel) {
          lastReportedLabel = newLabel;
          tracker.callbacks.onLabelChange?.(newLabel);
        }
      } else {
        tracker.callbacks.onSegmentChange?.(null);
        lastReportedSegment = null;

        if (currentSpeaker !== null) {
          currentSpeaker = null;
          tracker.callbacks.onSpeakerChange?.(null);
        }

        if (lastReportedLabel !== null) {
          lastReportedLabel = null;
          tracker.callbacks.onLabelChange?.(null);
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

  function handleSeeking(): void {
    currentSegmentIndex = -1;
    isInitialized = false;
    handleTimeUpdate();
  }

  // Initial sync on load
  handleTimeUpdate();

  // Public API
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
    const currentSeg = tracker.getCurrentSegment?.();
    return currentSeg?.speaker || null;
  };

  tracker.seekToSegmentById = (id: string) => {
    if (!id) return;
    const segment = validatedSegments.find((seg) => seg.id === id);
    if (segment?.start != null) {
      const duration = tracker.getDuration();
      const seekTime = Math.min(Math.max(segment.start, 0), duration);
      tracker.seekTo(seekTime);
    }
  };

  tracker.seekToSegmentByLabel = (label: string) => {
    if (!label) return;
    const segment = validatedSegments.find((seg) => seg.label === label);
    if (segment?.start != null) {
      const duration = tracker.getDuration();
      const seekTime = Math.min(Math.max(segment.start, 0), duration);
      tracker.seekTo(seekTime);
    }
  };

  tracker.seekToSegmentByOrder = (order: number) => {
    if (typeof order !== "number") return;
    const segment = validatedSegments.find((seg) => seg.order === order);
    if (segment?.start != null) {
      const duration = tracker.getDuration();
      const seekTime = Math.min(Math.max(segment.start, 0), duration);
      tracker.seekTo(seekTime);
    }
  };

  tracker.seekToSubSegmentById = (id: string) => {
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

  tracker.subscribe("timeupdate", handleTimeUpdate);
  tracker.subscribe("seeking", handleSeeking);

  return () => {
    tracker.unsubscribe("timeupdate", handleTimeUpdate);
    tracker.unsubscribe("seeking", handleSeeking);
  };
}
