# Timestamp Module

> Segment-aware audio playback and real-time speaker tracking for AudioTracker

The Timestamp module adds robust time-based segmentation, chapter navigation, and speaker/subsegment tracking to your audio playback. Perfect for podcasts, interviews, educational audio, and content with chapters or speakers.

**[← Back to Main Documentation](https://github.com/tvicky7x/audio-tracker#readme)**

---

## Table of Contents

- Features
- Installation
- Quick Start
- Best Timestamp Structure
- API Documentation
- Usage Examples
- Browser Support
- Common Issues

---

## Features

- 🏷 **Segmented Audio** – Define chapters, subchapters, and speakers via timestamp metadata
- 🗣 **Speaker Tracking** – Detect speaker changes in real-time during playback
- ⏱ **Subsegment Support** – Track fine-grained audio ranges within segments
- 🔄 **Callbacks** – Get notified on segment/subsegment/speaker transitions
- 🧭 **Seek by ID** – Instantly jump to segment or subsegment by identifier
- ⚡ **Flexible Gaps** – Choose segment-persistence behavior outside segments
- 🎯 **TypeScript Ready** – Full type definitions included
- ⚙️ **Zero Dependencies** – Modular and tree-shakeable

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

const tracker = new AudioTracker("/audio.mp3", {
  timestamp: {
    segments: [
      {
        id: "intro",
        order: 1,
        start: 0,
        end: 30,
        speaker: { id: "host", name: "Host Name" },
        text: "Introduction",
        subSegments: [
          { id: "s1", order: 1, start: 0, end: 10, text: "Intro start" },
          { id: "s2", order: 2, start: 10, end: 30, text: "Intro end" },
        ],
      },
      {
        id: "main",
        order: 2,
        start: 30,
        end: 180,
        text: "Main discussion",
        subSegments: [
          { id: "s3", order: 1, start: 30, end: 90, text: "Topic 1" },
          { id: "s4", order: 2, start: 90, end: 180, text: "Topic 2" },
        ],
      },
    ],
    gapBehavior: "persist-previous",
  },
});

tracker.use(timestampModule);

tracker.init({
  onSegmentChange: (seg) => console.log("Segment:", seg),
  onSpeakerChange: (speaker) => console.log("Speaker:", speaker),
});

tracker.play();
```

---

## Best Timestamp Structure

Below is the recommended, developer-friendly example structure. This template uses all fields for clarity and maintainability:

```typescript
const timestampData = {
  segments: [
    {
      id: "seg1", // Unique string ID (REQUIRED)
      order: 1, // Order in sequence (RECOMMENDED)
      start: 0, // Segment start time in seconds (REQUIRED)
      end: 30, // Segment end time in seconds (REQUIRED)
      speaker: {
        // Optional speaker info
        id: "sp1",
        name: "Speaker 1",
      },
      text: "Intro", // Optional text/label for display
      subSegments: [
        {
          id: "sub1",
          order: 1,
          start: 0,
          end: 10,
          text: "Part 1",
        },
        {
          id: "sub2",
          order: 2,
          start: 10,
          end: 30,
          text: "Part 2",
        },
      ],
    },
    {
      id: "seg2",
      order: 2,
      start: 30,
      end: 60,
      text: "Main section",
      subSegments: [
        {
          id: "sub3",
          order: 1,
          start: 30,
          end: 45,
          text: "First half",
        },
        {
          id: "sub4",
          order: 2,
          start: 45,
          end: 60,
          text: "Second half",
        },
      ],
    },
  ],
  gapBehavior: "persist-previous",
};
```

- **Always use `id`, `order`, `start`, `end` for each segment and subsegment.**
- Supply `speaker` and `text` whenever clarity or UI mapping is needed.

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
  order?: number;
  start: number;
  end: number;
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
  order?: number;
  start: number;
  end: number;
  text?: string;
}
```

#### gapBehavior

- `"persist-previous"`: Hold onto the last valid segment if playback leaves all segments.
- `"persist-next"`: Fallback to the next segment in gaps.
- `null` or omitted: No persistence outside defined segments.

---

### Extended Methods

| Method Name                | Returns              | Description                            |
| -------------------------- | -------------------- | -------------------------------------- |
| `getCurrentSegment()`      | `Segment \| null`    | Returns current segment or gap segment |
| `getCurrentSubSegment()`   | `SubSegment \| null` | Returns current subsegment             |
| `getCurrentSpeaker()`      | `Speaker \| null`    | Returns current speaker (if available) |
| `seekToSegmentById(id)`    | `void`               | Seeks to segment with given ID         |
| `seekToSubSegmentById(id)` | `void`               | Seeks to subsegment with given ID      |

---

### Callbacks

```typescript
tracker.init({
  onSegmentChange: (segment) => {
    /* Fires on segment change */
  },
  onSpeakerChange: (speaker) => {
    /* Fires on speaker change */
  },
  onSubSegmentChange: (subSegment) => {
    /* Fires on subsegment change */
  },
});
```

---

## Usage Examples

### Podcast with Chapters, Subchapters, and Speaker Tracking

```typescript
import AudioTracker, { timestampModule } from "audio-tracker";

const timestampData = {
  segments: [
    {
      id: "intro",
      order: 1,
      start: 0,
      end: 30,
      speaker: { id: "host", name: "Host" },
      text: "Introduction",
      subSegments: [
        { id: "i1", order: 1, start: 0, end: 10, text: "Opening" },
        { id: "i2", order: 2, start: 10, end: 30, text: "Overview" },
      ],
    },
    {
      id: "panel",
      order: 2,
      start: 30,
      end: 90,
      speaker: { id: "guest1", name: "Guest 1" },
      text: "Panel Discussion",
      subSegments: [
        { id: "p1", order: 1, start: 30, end: 60, text: "Topic A" },
        { id: "p2", order: 2, start: 60, end: 90, text: "Topic B" },
      ],
    },
  ],
  gapBehavior: "persist-previous",
};

const tracker = new AudioTracker("/episode.mp3", { timestamp: timestampData });

tracker.use(timestampModule);

tracker.init({
  onSegmentChange: (seg) => console.log("Segment:", seg),
  onSubSegmentChange: (sub) => console.log("Subsegment:", sub),
  onSpeakerChange: (speaker) => console.log("Speaker:", speaker),
});
```

### Seek to a Segment or Subsegment

```typescript
tracker.seekToSegmentById?.("panel");
tracker.seekToSubSegmentById?.("p2");
```

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
      <div>Current segment: {segment?.text}</div>
      <div>Speaker: {speaker?.name}</div>
    </div>
  );
}
```

---

## Browser Support

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

### Segments or Subsegments Not Recognized

Check that each has valid `id`, and `start` < `end`.

### Callback Not Firing

Ensure you initialize with `tracker.init` and confirm segment IDs are correct.

### Unresponsive `seekToSegmentById`

Make sure the segment/subsegment ID exists (no typos) in your timestamp data.

---

**Made with ❤️ by T Vicky**

**Repository:** [github.com/tvicky7x/audio-tracker](https://github.com/tvicky7x/audio-tracker)
