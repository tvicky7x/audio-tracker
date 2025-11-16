# Timestamp Module

> Real-time audio segment & sub-segment tracking for rich, structured playback experiences

The Timestamp module enables precise segment tracking in AudioTracker—for podcasts, interviews, or chaptered content. Attach timestamp data with labeled segments, speakers, and sub-segments, and listen for segment changes, speaker shifts, or gap periods as the user plays audio.

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

- ⏱️ **Segmented Playback** - Track entry/exit for labeled audio segments and sub-segments in real time
- 🧑‍💼 **Speaker Annotation** - Attach speaker metadata per segment (e.g., for interviews)
- 📝 **Custom Labels/Text** - Include text/chapter summaries for each section
- 🔄 **Gap Handling** - "Persist" previous or next segment even when playback moves outside a defined range
- ⚡ **Utility Methods** - Seek to any segment, jump to next/prev, query current state
- 🪝 **Rich Callbacks** - Listen for segment/subsegment/speaker change events as audio plays
- 🎯 **TypeScript Ready** - Full type definitions included
- 🎮 **UI-Agnostic** - Build transcript or chapter UIs without coupling audio logic to presentation

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
      id: "seg1",
      start: 0,
      end: 30,
      order: 1,
      speaker: { id: "sp1", name: "Host" },
      label: "Intro",
      text: "Hello and welcome",
      subSegments: [
        { id: "sub1", start: 0, end: 10, text: "Hello" },
        { id: "sub2", start: 10, end: 30, text: "and welcome" },
      ],
    },
    {
      id: "seg2",
      start: 30,
      end: 65,
      label: "Section 1",
      text: "Today's main topic...",
    },
  ],
  gapBehavior: "persist-previous", // or "persist-next"
};

const tracker = new AudioTracker("/podcast.mp3", { timestamp: timestampData });
tracker.use(timestampModule);

tracker.init({
  onSegmentChange: (segment) => console.log("📍 Now in:", segment?.label),
  onSpeakerChange: (speaker) => console.log("🗣️ Speaker:", speaker?.name),
});

tracker.play();
```

---

## API Documentation

### Timestamp Module

```typescript
function timestampModule(tracker: AudioTracker): () => void;
```

Attaches segment/sub-segment tracking and exposes state/query/utility methods.

#### Parameters

| Parameter | Type           | Description        |
| --------- | -------------- | ------------------ |
| `tracker` | `AudioTracker` | Instance to extend |

#### Returns

| Type         | Description                                    |
| ------------ | ---------------------------------------------- |
| `() => void` | Cleanup function to remove listeners/callbacks |

---

### TimestampOptions

Attach a `timestamp` option to AudioTracker during instantiation.

```typescript
interface TimestampOptions {
  segments?: Segment[];
  gapBehavior?: "persist-previous" | "persist-next" | null;
}
```

- **segments:** Array of Segment objects (see below)
- **gapBehavior:** When playback leaves a segment, "persist-previous" continues the last segment, "persist-next" jumps ahead, or `null` = no segment

---

### Segment and SubSegment

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
  text?: string;
}

interface Segment {
  id: string;
  label?: string;
  start: number;
  end: number;
  order?: number;
  speaker?: Speaker | null;
  text?: string;
  subSegments?: SubSegment[];
}
```

---

### Callbacks

Add callbacks via `tracker.init()` for real-time change events:

| Callback             | Parameter                  | Description                     |
| -------------------- | -------------------------- | ------------------------------- |
| `onSegmentChange`    | (segment: Segment \| null) | Fires when main segment changes |
| `onSegmentEnter`     | (segment: Segment \| null) | Fires on entering a segment     |
| `onSegmentExit`      | (segment: Segment \| null) | Fires on leaving a segment      |
| `onSubSegmentChange` | (sub: SubSegment \| null)  | Fires when sub-segment changes  |
| `onSubSegmentEnter`  | (sub: SubSegment \| null)  | Fires on entering a sub-segment |
| `onSubSegmentExit`   | (sub: SubSegment \| null)  | Fires on leaving a sub-segment  |
| `onSpeakerChange`    | (speaker: Speaker \| null) | Fires when speaker changes      |

---

### Extended Methods

After attaching, the following are available on the tracker instance:

| Method                          | Returns            | Description                                 |
| ------------------------------- | ------------------ | ------------------------------------------- |
| `getCurrentSegment()`           | Segment \| null    | Currently active main segment               |
| `getCurrentSubSegment()`        | SubSegment \| null | Currently active sub-segment                |
| `getCurrentSpeaker()`           | Speaker \| null    | Current speaker for this segment            |
| `getAllSegments()`              | Segment[]          | All user-defined segments                   |
| `getSubSegmentsBySegmentId(id)` | SubSegment[]       | All sub-segments for a given segment        |
| `seekToSegmentById(id)`         | void               | Seek to the start of a segment              |
| `seekToSubSegmentById(id)`      | void               | Seek to the start of a sub-segment          |
| `getNextSegment()`              | Segment \| null    | Next logical segment after current          |
| `getPreviousSegment()`          | Segment \| null    | Previous segment                            |
| `seekToNextSegment()`           | void               | Jump to next segment                        |
| `seekToPreviousSegment()`       | void               | Jump to previous segment                    |
| `isInGap()`                     | boolean            | Is playback currently outside all segments? |
| `getGapBehavior()`              | string \| null     | "persist-previous", "persist-next", or null |
| `getSegmentAtTime(time)`        | Segment \| null    | Segment at a specific time                  |
| `getSubSegmentAtTime(time)`     | SubSegment \| null | Sub-segment at a specific time              |

---

## Usage Examples

### Podcast Chapters with Speakers

```typescript
const timestampData = {
  segments: [
    {
      id: "intro",
      start: 0,
      end: 15,
      label: "Introduction",
      speaker: { id: "host", name: "Host" },
      text: "Welcome to the show.",
      subSegments: [
        { id: "intro-1", start: 0, end: 5, text: "Welcome" },
        { id: "intro-2", start: 5, end: 15, text: "to the show." },
      ],
    },
    {
      id: "main",
      start: 15,
      end: 120,
      label: "Interview",
      speaker: { id: "guest", name: "Guest" },
      text: "Interview section",
    },
  ],
  gapBehavior: "persist-previous",
};

const tracker = new AudioTracker("/show.mp3", { timestamp: timestampData });
tracker.use(timestampModule);

tracker.init({
  onSpeakerChange: (sp) => console.log("Speaker:", sp?.name),
  onSegmentChange: (seg) => console.log("Now at:", seg?.label),
});

tracker.seekToSegmentById("main"); // Jumps to interview
```

---

### Jump to Next/Previous Segment

```typescript
// Jump to next section (useful for 'skip intro')
// e.g. on a 'Next' button click:
tracker.seekToNextSegment();

// Jump back to previous chapter
tracker.seekToPreviousSegment();
```

---

### Custom Transcript UI

Extract and render current segment label/text for UX highlighting:

```typescript
const current = tracker.getCurrentSegment();
if (current) {
  display(current.label, current.text); // Show in your UI
}
```

---

### Gap Handling

Choose gap behavior with `gapBehavior`:

- `"persist-previous"` - Continue showing last segment's text when in gaps (default)
- `"persist-next"` - Jump early to the next segment, if out of range
- `null` - No fallback; no segment/sub-segment reported outside defined ranges

---

## Browser Support

All features supported in any browser running JavaScript and HTML5 `<audio>`. No external dependencies.

---

## Common Issues

### No Segments Provided

If you forget to supply segments:

```typescript
const tracker = new AudioTracker("/audio.mp3", { timestamp: {} });
tracker.use(timestampModule); // Logs warning, performs no segment tracking
```

**Solution:** Provide a non-empty `segments` array.

---

### Segment `start` >= `end`

Segments where `start` is not before `end` are ignored:

```typescript
{
  id: "bad",
  start: 50,
  end: 30 // Ignored by validator
}
```

---

### Seeking vs Live Updates

On large-segmented audio, rapid seeking may cause many events. If you debounce your UI, listen to only `onSegmentChange` instead of all events.

---

### Sub-segments not matching playback

Sub-segments should be non-overlapping and strictly within the parent segment's range.

---

## Best Practices

- Order segments and sub-segments in increasing time order for clarity.
- Normalize your timestamps programmatically before passing to AudioTracker.
- Use `gapBehavior` if you want UI to never be empty outside segment windows.
- Use rich segment properties: speakers, text, order, and custom fields for your own UI.

---

## Related Documentation

- **[Main AudioTracker Documentation](https://github.com/tvicky7x/audio-tracker#readme)**
- **[Media Session Module](https://github.com/tvicky7x/audio-tracker/blob/main/docs/media-session.md)**

---

**Made with ❤️ by T Vicky**

**Repository:** [github.com/tvicky7x/audio-tracker](https://github.com/tvicky7x/audio-tracker)
