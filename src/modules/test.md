# Timestamp Module

> Chapter and speaker tracking for podcasts, interviews, and multi-segment audio. Precise real-time callbacks for segments, subsegments, speakers, and labels.

The Timestamp module adds structure to audio playback by tracking **segments** (like chapters) and **subsegments** (like sentences), firing callbacks whenever the listener transitions between them. Use it for enhanced podcast navigation, chapter lists, speaker highlighting, or custom audio timelines.

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

- 🪧 **Segment & Subsegment Tracking** - Divide audio into chapters, sentences, or scene markers
- 🗣️ **Speaker Highlighting** - Fires callback when active speaker changes
- 🏷️ **Label Changes** - Automatically notifies on label transitions
- 🔁 **Custom Gap Behavior** - Persist previous/next segment during silence or gaps
- 📚 **Query API** - Jump to segments/subsegments by id, label, or order
- 🪝 **Rich Callback System** - Enter, exit, and change events for all entities
- ⏮️ **Prev/Next Navigation** - Jump to adjacent segments with built-in methods
- 🎯 **TypeScript Ready** - Full type definitions included

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
        start: 0,
        end: 30,
        speaker: { id: "host", name: "Host Name" },
        label: "Introduction",
        text: "Intro text...",
        subSegments: [
          { id: "s1", start: 0, end: 10, text: "Hello" },
          { id: "s2", start: 10, end: 30, text: "Welcome!" },
        ],
      },
      {
        id: "main",
        start: 30,
        end: 90,
        label: "Body",
        text: "Podcast conversation...",
      },
    ],
    gapBehavior: "persist-previous",
  },
});

// Enable Timestamp integration
tracker.use(timestampModule);

tracker.init({
  onSegmentChange: (segment) => console.log("Segment:", segment),
  onSpeakerChange: (speaker) => console.log("Speaker:", speaker),
});
```

---

## API Documentation

### Module Function

```typescript
function timestampModule(tracker: AudioTracker): () => void;
```

Adds real-time segment, subsegment, speaker, and label tracking to AudioTracker.

#### Parameters

| Parameter | Type           | Description        |
| --------- | -------------- | ------------------ |
| `tracker` | `AudioTracker` | Instance to extend |

#### Returns

| Type         | Description                           |
| ------------ | ------------------------------------- |
| `() => void` | Cleanup function (unsubscribe events) |

---

### Configuration Options

Pass a `timestamp` object to AudioTracker’s constructor options:

```typescript
interface TimestampOptions {
  segments?: Segment[];
  gapBehavior?: "persist-previous" | "persist-next" | null;
}
```

#### Segment Structure

```typescript
interface Segment {
  id: string;
  start: number;
  end: number;
  order?: number; // Optional: for ordered navigation
  speaker?: Speaker | null;
  label?: string;
  text: string;
  subSegments?: SubSegment[];
}
```

#### Speaker and SubSegment

```typescript
interface Speaker {
  id: string;
  name?: string;
}

interface SubSegment {
  id: string;
  start: number;
  end: number;
  order?: number;
  text: string;
}
```

---

### Extended Methods

When the Timestamp module is attached, AudioTracker gains additional query and navigation methods:

| Method                        | Description                           | Returns                                        |
| ----------------------------- | ------------------------------------- | ---------------------------------------------- |
| `getAllSegments()`            | Returns all segments                  | `Segment[]`                                    |
| `getCurrentSegment()`         | Gets current segment                  | `Segment \| null`                              |
| `getSegmentAtTime(time)`      | Segment at specified time             | `Segment \| null`                              |
| `getNextSegment()`            | Gets next segment                     | `Segment \| null`                              |
| `getPreviousSegment()`        | Gets previous segment                 | `Segment \| null`                              |
| `seekToSegmentById(id)`       | Seeks to segment by id                | `void`                                         |
| `seekToSegmentByLabel(label)` | Seeks to segment by label             | `void`                                         |
| `seekToSegmentByOrder(order)` | Seeks to nth segment                  | `void`                                         |
| `seekToNextSegment()`         | Seeks to next segment                 | `void`                                         |
| `seekToPreviousSegment()`     | Seeks to previous segment             | `void`                                         |
| `isInGap()`                   | True if current time outside segments | `boolean`                                      |
| `getGapBehavior()`            | Returns current gap behavior          | `"persist-previous" \| "persist-next" \| null` |

#### SubSegment Methods

| Method                          | Description                           | Returns              |
| ------------------------------- | ------------------------------------- | -------------------- |
| `getCurrentSubSegment()`        | Gets current subsegment               | `SubSegment \| null` |
| `getSubSegmentsBySegmentId(id)` | Returns subsegments for given segment | `SubSegment[]`       |
| `getSubSegmentAtTime(time)`     | Subsegment at given time              | `SubSegment \| null` |
| `seekToSubSegmentById(id)`      | Seeks to subsegment by id             | `void`               |

#### Speaker and Label Methods

| Method                | Description          | Returns           |
| --------------------- | -------------------- | ----------------- |
| `getCurrentSpeaker()` | Gets current speaker | `Speaker \| null` |

---

### Callback Events

Attach callback handlers in `tracker.init()`:

| Callback             | Parameters                   | Fires When               |
| -------------------- | ---------------------------- | ------------------------ |
| `onSegmentChange`    | `(segment: Segment \| null)` | On segment change        |
| `onSegmentEnter`     | `(segment: Segment \| null)` | When entering segment    |
| `onSegmentExit`      | `(segment: Segment \| null)` | When leaving segment     |
| `onSubSegmentChange` | `(sub: SubSegment \| null)`  | On subsegment change     |
| `onSubSegmentEnter`  | `(sub: SubSegment \| null)`  | When entering subsegment |
| `onSubSegmentExit`   | `(sub: SubSegment \| null)`  | When leaving subsegment  |
| `onSpeakerChange`    | `(speaker: Speaker \| null)` | When speaker changes     |
| `onLabelChange`      | `(label: string \| null)`    | When label changes       |

---

## Usage Examples

### Podcast Chapters

```typescript
import AudioTracker, { timestampModule } from "audio-tracker";

const tracker = new AudioTracker("/episode.mp3", {
  timestamp: {
    segments: [
      { id: "intro", start: 0, end: 30, label: "Intro", text: "Welcome!" },
      {
        id: "guest",
        start: 30,
        end: 180,
        label: "Interview",
        text: "Interview with guest.",
      },
      {
        id: "outro",
        start: 180,
        end: 200,
        label: "Outro",
        text: "Thanks for listening.",
      },
    ],
    gapBehavior: "persist-previous",
  },
});
tracker.use(timestampModule);
tracker.init({
  onSegmentChange: (seg) => {
    if (seg) console.log("Now in:", seg.label);
  },
});
tracker.seekToSegmentByLabel("Interview");
```

---

### Speaker and Subsegment

```typescript
const tracker = new AudioTracker("/multi.mp3", {
  timestamp: {
    segments: [
      {
        id: "s1",
        start: 0,
        end: 20,
        speaker: { id: "sp1", name: "Host" },
        text: "Welcome segment",
        subSegments: [
          { id: "line1", start: 0, end: 10, text: "Hello" },
          { id: "line2", start: 10, end: 20, text: "All!" },
        ],
      },
    ],
  },
});
tracker.use(timestampModule);
tracker.init({
  onSpeakerChange: (s) => console.log("Speaker changed:", s?.name),
  onSubSegmentChange: (sub) => console.log("Subsegment:", sub?.text),
});
tracker.seekToSubSegmentById("line2");
```

---

### Gap Handling

```typescript
const tracker = new AudioTracker("/audio.mp3", {
  timestamp: {
    segments: [
      { id: "part1", start: 0, end: 60, text: "First minute" },
      { id: "part2", start: 120, end: 180, text: "Third minute" },
    ],
    gapBehavior: "persist-next", // Always jump to next segment in gaps
  },
});
tracker.use(timestampModule);
tracker.init({
  onSegmentChange: (segment) => {
    if (!segment) console.log("In a gap section");
  },
});
```

---

## Browser Support

Does **not** require any special browser features. Timestamp tracking works as long as the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) or HTML5 audio is supported.

| Browser    | Core Audio Support | Module Support |
| ---------- | ------------------ | -------------- |
| Chrome     | 57+                | ✅             |
| Firefox    | 52+                | ✅             |
| Safari     | 11+                | ✅             |
| Edge       | 79+                | ✅             |
| Opera      | 44+                | ✅             |
| iOS Safari | 11+                | ✅             |
| Android    | 67+                | ✅             |

---

## Common Issues

### Issue: No callbacks firing

**Solution:** Ensure your `segments` array in `timestamp` options is not empty and `start < end` is valid for all segments.

### Issue: Incorrect ordering

**Solution:** If not using `order` property, segments are auto-numbered based on their array order.

### Issue: Callback fires, but data is null

**Cause:** The current playback time is outside all defined segments, and `gapBehavior` returns null.

**Solution:** Set `gapBehavior` to `"persist-previous"` or `"persist-next"` if you want segment/subsegment to persist in gaps.

### Issue: Seek methods not going to expected position

**Solution:** Confirm that the target segment, label, or subsegment id exists and has valid start/end values.

---

## Best Practices

- Always specify `start` and `end` in **seconds**.
- Use `label` for display-friendly chapter names.
- For speaker tracking, include an object `{ id, name }` for each segment.
- Prefer `subSegments` for detailed phrase or sentence tracking.
- Test edge cases when seeking inside silent/gap ranges.

---

## Related Documentation

- **[Main AudioTracker Documentation](https://github.com/tvicky7x/audio-tracker#readme)**
- **[Media Session Module](https://github.com/tvicky7x/audio-tracker/blob/main/docs/media-session.md)**

---

**Made with ❤️ by T Vicky**

**Repository:** [github.com/tvicky7x/audio-tracker](https://github.com/tvicky7x/audio-tracker)
