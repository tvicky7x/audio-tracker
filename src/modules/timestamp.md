# Timestamp Module

> Segment/chapter-aware audio tracking for timelines, podcasts, speaker detection, and more with AudioTracker

The Timestamp module adds **real-time segment, sub-segment, and speaker tracking** to any audio powered by AudioTracker. Easily manage chapters, highlights, and interactive playback controls for podcasts, interviews, or time-stamped educational content.

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

- 🏷️ **Segment & Chapter Tracking** - Define reusable audio segments with order, labels, speakers, and sub-segments
- 🧑 **Speaker Detection** - Tracks speaker changes in real time and fires events
- ⏱️ **Sub-Segment (Phrase) Markers** - Nested sub-segments for transcript sync or karaoke-style phrase highlighting
- 🔀 **Gap Behavior** - Control what happens when audio is between defined segments
- 🔊 **Real-Time Callbacks** - `onSegmentChange`, `onSpeakerChange`, `onSubSegmentChange`, `onLabelChange`
- 🔗 **Direct Navigation** - Seek by segment id, label, or order
- 🚀 **TypeScript-Friendly** - All interfaces and options typed out of the box
- 💡 **Non-Intrusive** - Easily add/remove from any tracker instance

---

## Installation

Timestamp module is included with the main `audio-tracker` package.

```bash
npm install audio-tracker
```

---

## Quick Start

```typescript
import AudioTracker, { timestampModule } from "audio-tracker";

const tracker = new AudioTracker("/podcast.mp3", {
  timestamp: {
    segments: [
      {
        id: "intro",
        start: 0,
        end: 30,
        speaker: { id: "host", name: "Host Name" },
        label: "Introduction",
        text: "Welcome to the show",
        subSegments: [
          { id: "intro-1", start: 0, end: 10, text: "Welcome" },
          { id: "intro-2", start: 10, end: 30, text: "to the show" },
        ],
      },
      {
        id: "topic1",
        start: 30,
        end: 90,
        label: "Main Topic",
        text: "Today's discussion: ...",
        speaker: { id: "guest", name: "Guest Speaker" },
      },
    ],
    gapBehavior: "persist-previous",
  },
});

// Add timestamp awareness to the tracker
tracker.use(timestampModule);

// Set up callbacks for segment/speaker changes
tracker.init({
  onSegmentChange: (segment) => console.log("Segment:", segment?.label),
  onSpeakerChange: (speaker) => console.log("Speaker:", speaker?.name),
  onSubSegmentChange: (phrase) => console.log("Phrase:", phrase?.text),
});
```

---

## API Documentation

### Module Function

```typescript
function timestampModule(tracker: AudioTracker): () => void;
```

Enables time-based segment, speaker, and sub-segment tracking, and adds utility methods for navigation and inspection.

#### Parameters

| Parameter | Type           | Description                     |
| --------- | -------------- | ------------------------------- |
| `tracker` | `AudioTracker` | AudioTracker instance to extend |

#### Returns

| Type         | Description                                 |
| ------------ | ------------------------------------------- |
| `() => void` | Cleanup function to unsubscribe from events |

---

### Configuration Options

Pass `timestamp` configuration in the AudioTracker options:

```typescript
interface TimestampOptions {
  segments?: Segment[];
  gapBehavior?: "persist-previous" | "persist-next" | null;
}
```

- **segments:** (required) Segment array (see below)
- **gapBehavior:** Action when no segment is active
  - `"persist-previous"`: Use previous segment info
  - `"persist-next"`: Use next segment info
  - `null`: No segment info in gaps

#### Segment Structure

```typescript
interface Segment {
  id: string; // Unique identifier
  start: number; // Segment start time (seconds)
  end: number; // Segment end time (seconds)
  order?: number; // Optional play order
  speaker?: Speaker; // Optional speaker data
  label?: string; // Optional label (display name)
  text?: string; // Optional segment text/transcript
  subSegments?: SubSegment[]; // Optional list of sub-segments
}
```

##### Speaker

```typescript
interface Speaker {
  id: string;
  name?: string;
}
```

##### SubSegment

```typescript
interface SubSegment {
  id: string;
  start: number;
  end: number;
  order?: number;
  text?: string;
}
```

---

### Added Instance Methods

After attaching, AudioTracker exposes:

| Method                        | Returns              | Description                      |
| ----------------------------- | -------------------- | -------------------------------- |
| `getCurrentSegment()`         | `Segment \| null`    | Current segment at playback time |
| `getCurrentSubSegment()`      | `SubSegment \| null` | Current sub-segment at playback  |
| `getCurrentSpeaker()`         | `Speaker \| null`    | Speaker for current segment      |
| `seekToSegmentById(id)`       | `void`               | Seek to segment by id            |
| `seekToSegmentByLabel(label)` | `void`               | Seek by human label              |
| `seekToSegmentByOrder(order)` | `void`               | Seek by sequential order         |
| `seekToSubSegmentById(id)`    | `void`               | Seek to sub-segment by id        |

---

### Supported Callbacks

Attach by passing to AudioTracker’s `init`:

| Callback             | Params               | Fires When                              |
| -------------------- | -------------------- | --------------------------------------- |
| `onSegmentChange`    | `Segment \| null`    | Segment changes or becomes inactive     |
| `onSpeakerChange`    | `Speaker \| null`    | Speaker changes or becomes inactive     |
| `onLabelChange`      | `string \| null`     | Label changes or becomes inactive       |
| `onSubSegmentChange` | `SubSegment \| null` | Sub-segment changes or becomes inactive |

---

## Usage Examples

### Chapter Navigation UI

```typescript
// List chapter labels for a seekbar menu
const tracker = new AudioTracker("/book.mp3", {
  timestamp: {
    segments: [
      { id: "ch1", start: 0, end: 100, label: "Chapter 1" },
      { id: "ch2", start: 100, end: 200, label: "Chapter 2" },
    ],
  },
});

tracker.use(timestampModule);

// Go to second chapter
tracker.seekToSegmentByLabel?.("Chapter 2");
```

---

### Speaker Timeline

```typescript
const tracker = new AudioTracker("/interview.mp3", {
  timestamp: {
    segments: [
      { id: "q1", start: 0, end: 50, speaker: { id: "host", name: "Host" } },
      {
        id: "a1",
        start: 50,
        end: 150,
        speaker: { id: "guest", name: "Dr. Guest" },
      },
    ],
  },
});
tracker.use(timestampModule);

tracker.init({
  onSpeakerChange: (sp) => showSpeakerBadge(sp?.name),
});
```

---

### Sub-Segment Phrase Highlight

```typescript
const tracker = new AudioTracker("/reading.mp3", {
  timestamp: {
    segments: [
      {
        id: "s1",
        start: 0,
        end: 5,
        subSegments: [
          { id: "w1", start: 0, end: 2.5, text: "Hello" },
          { id: "w2", start: 2.5, end: 5, text: "World" },
        ],
      },
    ],
  },
});
tracker.use(timestampModule);

tracker.init({
  onSubSegmentChange: (phrase) => highlightWord(phrase?.text),
});
```

---

### Cleanup

```typescript
const tracker = new AudioTracker("/audio.mp3", {...});
const cleanup = tracker.use(timestampModule);

cleanup(); // Unsubscribes event handlers

// Or simply destroy tracker
tracker.destroy();
```

---

## Browser Support

**All core features work on any browser that supports JavaScript and Web Audio API:**

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

### Issue: onSegmentChange not firing

**Solution:** Ensure timestamp config’s `segments` array is populated and valid (start < end):

```typescript
{
  segments: [{ id: "a", start: 0, end: 25 }];
}
```

---

### Issue: Gaps between segments

Control with `gapBehavior`:

- `"persist-previous"`: Last segment persists during gaps (default)
- `"persist-next"`: Next segment info used during gaps
- `null`: No segment/speaker reported in gaps

---

### Issue: Seeking doesn’t update segment

The module listens for `"timeupdate"` and `"seeking"` events—make sure you use AudioTracker’s seek methods.

---

### Issue: Sub-segment never updates

**Solution:** Each sub-segment’s `start` and `end` must be within its parent segment, and non-overlapping.

---

## Best Practices

- Always use unique `id` for segments and sub-segments
- Use `label` for friendly UI (chapter names, etc)
- Keep segment arrays sorted for best performance
- Use `onLabelChange` for real-time chapter title updates

---

## Related Documentation

- **[Main AudioTracker Documentation](https://github.com/tvicky7x/audio-tracker#readme)**
- **[Media Session Module](https://github.com/tvicky7x/audio-tracker/blob/main/docs/media-session.md)**

---

**Made with ❤️ by T Vicky**

**Repository:** [github.com/tvicky7x/audio-tracker](https://github.com/tvicky7x/audio-tracker)
