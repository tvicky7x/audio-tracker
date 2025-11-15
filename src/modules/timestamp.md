# Timestamp Module

> Segment-aware audio playback and real-time speaker tracking for AudioTracker

The Timestamp module adds robust time-based segmentation, chapter navigation, and speaker/subsegment tracking to your audio playback. Perfect for podcasts, interviews, educational audio, and content with chapters or speakers.

**[← Back to Main Documentation](https://github.com/tvicky7x/audio-tracker#readme)**

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Usage Examples](#usage-examples)
- [Browser Support](#browser-support)
- [Common Issues](#common-issues)

---

## Features

- 🏷 **Segmented Audio** - Define chapters, subchapters, and speakers via timestamp metadata
- 🗣 **Speaker Tracking** - Detect speaker changes in real-time during playback
- ⏱ **Subsegment Support** - Track fine-grained audio ranges within segments
- 🔄 **Callbacks** - Get notified on segment/subsegment/speaker transitions
- 🧭 **Seek by ID** - Instantly jump to segment or subsegment by identifier
- ⚡ **Flexible Gaps** - Choose segment-persistence behavior outside segments
- 🎯 **TypeScript Ready** - Full type definitions included
- ⚙️ **Zero Dependencies** - Modular and tree-shakeable

---

## Installation

The Timestamp module is included with the main `audio-tracker` package.

```bash
npm install audio-tracker
```

---

## Quick Start

```typescript
import AudioTracker, { timestampModule } from "audio-tracker";

const timestampData = {
  segments: [
    {
      id: "intro",
      start: 0,
      end: 30,
      speaker: { id: "host", name: "Host Name" },
      text: "Introduction",
    },
    {
      id: "main",
      start: 30,
      end: 180,
      text: "Main discussion",
    },
  ],
  gapBehavior: "persist-previous", // Optional: keeps last valid segment outside regions
};

const tracker = new AudioTracker("/podcast.mp3", { timestamp: timestampData });

tracker.use(timestampModule);

tracker.init({
  onSegmentChange: (segment) => console.log("Current segment:", segment),
  onSpeakerChange: (speaker) => console.log("Speaker:", speaker),
});

tracker.play();
```

---

## API Documentation

### Module Function

```typescript
function timestampModule(tracker: AudioTracker): () => void;
```

Extends AudioTracker with timestamp/segment/speaker awareness and navigation.

#### Parameters

| Parameter | Type           | Description                     |
| --------- | -------------- | ------------------------------- |
| `tracker` | `AudioTracker` | AudioTracker instance to extend |

#### Returns

| Type         | Description                            |
| ------------ | -------------------------------------- |
| `() => void` | Cleanup function to remove event hooks |

---

### Timestamp Metadata Configuration

Pass timestamp data with the `timestamp` option when creating your tracker:

```typescript
interface TimestampOptions {
  segments?: Segment[];
  gapBehavior?: "persist-previous" | "persist-next" | null;
}

interface Segment {
  id: string;
  start: number;
  end: number;
  order?: number;
  speaker?: Speaker | null;
  text?: string;
  subSegments?: SubSegment[];
}

interface Speaker {
  id: string;
  name: string;
}

interface SubSegment {
  id: string;
  start: number;
  end: number;
  order?: number;
  text?: string;
}
```

**Recommended:** Always specify both `start` and `end` for segments/subsegments.

#### gapBehavior

- `"persist-previous"`: Hold onto the last valid segment if playback leaves all segments.
- `"persist-next"`: Fallback to the next segment in gaps.
- `null` or omitted: No persistence outside defined segments.

---

### Extended Methods

The module enhances the tracker with:

| Method Name                | Returns              | Description                            |
| -------------------------- | -------------------- | -------------------------------------- |
| `getCurrentSegment()`      | `Segment \| null`    | Returns current segment or gap segment |
| `getCurrentSubSegment()`   | `SubSegment \| null` | Returns current subsegment             |
| `getCurrentSpeaker()`      | `Speaker \| null`    | Returns current speaker (if available) |
| `seekToSegmentById(id)`    | `void`               | Seeks to segment with given ID         |
| `seekToSubSegmentById(id)` | `void`               | Seeks to subsegment with given ID      |

---

### Callbacks

Add timestamp-aware callbacks during tracker initialization:

```typescript
tracker.init({
  onSegmentChange: (segment) => {
    /* Called when segment changes */
  },
  onSpeakerChange: (speaker) => {
    /* Called when speaker changes */
  },
  onSubSegmentChange: (subSegment) => {
    /* Called when subsegment changes */
  },
});
```

---

## Usage Examples

### Podcast with Chapter and Speaker Tracking

```typescript
import AudioTracker, { timestampModule } from "audio-tracker";

const tracker = new AudioTracker("/podcast.mp3", {
  timestamp: {
    segments: [
      {
        id: "ch1",
        start: 0,
        end: 30,
        text: "Intro",
        speaker: { id: "host", name: "Host" },
        subSegments: [
          { id: "q1", start: 0, end: 10, text: "Welcome" },
          { id: "a1", start: 10, end: 30, text: "Show Start" },
        ],
      },
      {
        id: "ch2",
        start: 30,
        end: 100,
        text: "Panel Discussion",
      },
    ],
  },
});

tracker.use(timestampModule);

tracker.init({
  onSegmentChange: (seg) => console.log("Segment:", seg),
  onSubSegmentChange: (sub) => console.log("Sub:", sub),
  onSpeakerChange: (speaker) => console.log("Speaker:", speaker),
});
```

---

### Seek to a Specific Segment

```typescript
// Jump to segment by ID
tracker.seekToSegmentById?.("ch2");

// Jump to subsegment by ID
tracker.seekToSubSegmentById?.("q1");
```

---

### React Integration

```typescript
import { useEffect, useRef, useState } from "react";
import AudioTracker, { timestampModule } from "audio-tracker";

function PodcastPlayer({ audioUrl, timestampData }) {
  const trackerRef = useRef<AudioTracker | null>(null);
  const [segment, setSegment] = useState(null);
  const [speaker, setSpeaker] = useState(null);

  useEffect(() => {
    trackerRef.current = new AudioTracker(audioUrl, {
      timestamp: timestampData,
    });
    trackerRef.current.use(timestampModule);

    trackerRef.current.init({
      onSegmentChange: (seg) => setSegment(seg),
      onSpeakerChange: (sp) => setSpeaker(sp),
    });

    return () => trackerRef.current?.destroy();
  }, [audioUrl, timestampData]);

  return (
    <div>
      <span>Current segment: {segment?.text}</span>
      <span>Speaker: {speaker?.name}</span>
    </div>
  );
}
```

---

## Browser Support

### Full Support

All major browsers that support ES6/ES2015 and Audio APIs:

| Browser         | Minimum Version |
| --------------- | --------------- |
| Chrome          | 57+             |
| Firefox         | 52+             |
| Safari          | 11+             |
| Edge            | 79+             |
| Opera           | 44+             |
| iOS Safari      | 11+             |
| Android Browser | 67+             |

---

## Common Issues

### Issue: Segments or Subsegments Not Recognized

**Solution:** Check that all `start` and `end` values are valid numbers and `start < end`.

---

### Issue: Callback Not Firing

**Solution:** Ensure your callback is initialized through `tracker.init` and your playback is progressing past segment boundaries.

---

### Issue: Unresponsive `seekToSegmentById`

**Solution:** Make sure the segment ID matches exactly. Check for typos or missing IDs in your metadata.

---

### Best Practices

- Keep all segments continuous (no big silent gaps unless intentional)
- Always supply a valid `id` for each segment and subsegment
- Update metadata and re-initialize the module if loading or changing segments dynamically
- For live or streaming audio, use `"gapBehavior"` to control out-of-bounds segment behavior

---

## Related Documentation

- **[Main AudioTracker Documentation](https://github.com/tvicky7x/audio-tracker#readme)**
- **[Media Session Module](https://github.com/tvicky7x/audio-tracker/blob/main/src/modules/media-session.md)**

---

**Made with ❤️ by T Vicky**

**Repository:** [github.com/tvicky7x/audio-tracker](https://github.com/tvicky7x/audio-tracker)
