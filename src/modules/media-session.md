# Media Session Module

> Native lock screen controls, media keys, and notification center integration for AudioTracker

The Media Session module integrates with the browser's [Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API) to provide system-level playback controls. Users can control audio from lock screens, notification centers, media keys, and Bluetooth devices.

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

- 🎮 **System Media Controls** - Lock screen, notification center, and media key integration
- 🖼️ **Rich Metadata** - Display title, artist, album, and artwork in system UI
- ⌨️ **Media Key Support** - Play, pause, seek forward/backward with hardware keys
- 🔄 **Position Sync** - Real-time playback position updates in system UI
- 📱 **Cross-Platform** - Works on desktop and mobile browsers
- 🎯 **TypeScript Ready** - Full type definitions included
- 🪝 **Auto-Cleanup** - Removes handlers and metadata when destroyed
- ⚡ **Progressive Enhancement** - Gracefully degrades on unsupported browsers

---

## Installation

The Media Session module is included with the main `audio-tracker` package.

```bash
npm install audio-tracker
```

---

## Quick Start

```typescript
import AudioTracker, { mediaSessionModule } from "audio-tracker";

const tracker = new AudioTracker("/audio.mp3", {
  mediaSession: {
    title: "Song Title",
    artist: "Artist Name",
    album: "Album Name",
    artwork: [
      { src: "/cover-96.jpg", sizes: "96x96", type: "image/jpeg" },
      { src: "/cover-512.jpg", sizes: "512x512", type: "image/jpeg" },
    ],
  },
});

// Enable Media Session integration
tracker.use(mediaSessionModule);

tracker.init({
  onPlay: () => console.log("▶️ Playing with system controls"),
});

tracker.play();
```

---

## API Documentation

### Module Function

```typescript
function mediaSessionModule(tracker: AudioTracker): (() => void) | void;
```

Extends AudioTracker with Media Session API integration. Automatically sets up action handlers and updates playback state.

#### Parameters

| Parameter | Type           | Description                     |
| --------- | -------------- | ------------------------------- |
| `tracker` | `AudioTracker` | AudioTracker instance to extend |

#### Returns

| Type         | Description                                     |
| ------------ | ----------------------------------------------- |
| `() => void` | Cleanup function to remove handlers/metadata    |
| `void`       | Returns void if Media Session API not supported |

---

### Configuration Options

Pass metadata through AudioTracker constructor options:

```typescript
interface MediaSessionOptions {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: MediaImage[];
}
```

#### MediaSessionOptions Properties

| Property  | Type           | Description                         |
| --------- | -------------- | ----------------------------------- |
| `title`   | `string`       | Track title                         |
| `artist`  | `string`       | Artist name                         |
| `album`   | `string`       | Album name                          |
| `artwork` | `MediaImage[]` | Array of artwork images (see below) |

#### MediaImage Interface

```typescript
interface MediaImage {
  src: string; // Image URL
  sizes?: string; // Image dimensions (e.g., "512x512")
  type?: string; // MIME type (e.g., "image/jpeg")
}
```

**Recommended artwork sizes:** 96x96, 128x128, 192x192, 256x256, 384x384, 512x512

---

### Extended Methods

When the Media Session module is attached, AudioTracker gains additional methods:

#### updateMediaSessionMetadata

```typescript
tracker.updateMediaSessionMetadata(metadata: MediaMetadataInit): void
```

Update Media Session metadata dynamically without recreating the tracker.

##### Parameters

| Parameter  | Type                | Description             |
| ---------- | ------------------- | ----------------------- |
| `metadata` | `MediaMetadataInit` | New metadata to display |

##### Example

```typescript
tracker.updateMediaSessionMetadata({
  title: "New Song",
  artist: "Different Artist",
  artwork: [{ src: "/new-cover.jpg", sizes: "512x512" }],
});
```

---

## Usage Examples

### Basic Setup

```typescript
import AudioTracker, { mediaSessionModule } from "audio-tracker";

const tracker = new AudioTracker("/podcast.mp3", {
  mediaSession: {
    title: "Episode 42: TypeScript Deep Dive",
    artist: "Tech Podcast",
    artwork: [{ src: "/podcast-art.jpg", sizes: "512x512" }],
  },
});

tracker.use(mediaSessionModule);
```

---

### Dynamic Metadata Updates

```typescript
// Initial setup
const tracker = new AudioTracker("/playlist/track1.mp3");
tracker.use(mediaSessionModule);

// Function to update track info
function loadTrack(trackData) {
  tracker.updateMediaSessionMetadata({
    title: trackData.title,
    artist: trackData.artist,
    album: trackData.album,
    artwork: trackData.artwork,
  });
}

// Update when track changes
loadTrack({
  title: "New Track",
  artist: "New Artist",
  album: "New Album",
  artwork: [
    { src: "/covers/new-track-96.jpg", sizes: "96x96" },
    { src: "/covers/new-track-512.jpg", sizes: "512x512" },
  ],
});
```

---

### Multiple Artwork Sizes

Provide multiple sizes for optimal display across devices:

```typescript
const tracker = new AudioTracker("/audio.mp3", {
  mediaSession: {
    title: "Song Title",
    artist: "Artist",
    artwork: [
      { src: "/art-96.jpg", sizes: "96x96", type: "image/jpeg" },
      { src: "/art-192.jpg", sizes: "192x192", type: "image/jpeg" },
      { src: "/art-512.jpg", sizes: "512x512", type: "image/jpeg" },
    ],
  },
});

tracker.use(mediaSessionModule);
```

---

### React Integration

```typescript
import { useEffect, useRef } from "react";
import AudioTracker, { mediaSessionModule } from "audio-tracker";

function MusicPlayer({ track }) {
  const trackerRef = useRef<AudioTracker | null>(null);

  useEffect(() => {
    trackerRef.current = new AudioTracker(track.url, {
      mediaSession: {
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
      },
    });

    trackerRef.current.use(mediaSessionModule);

    return () => trackerRef.current?.destroy();
  }, []);

  // Update metadata when track changes
  useEffect(() => {
    trackerRef.current?.updateMediaSessionMetadata({
      title: track.title,
      artist: track.artist,
      artwork: track.artwork,
    });
  }, [track]);

  return <div>Player controls...</div>;
}
```

---

### Cleanup and Destroy

```typescript
const tracker = new AudioTracker("/audio.mp3");
const cleanup = tracker.use(mediaSessionModule);

// Later, when done
cleanup(); // Removes all Media Session handlers and metadata

// Or use destroy() to clean up everything
tracker.destroy(); // Also cleans up Media Session integration
```

---

## Browser Support

### Full Support

Native Media Session API with all features:

| Browser         | Version | Notes        |
| --------------- | ------- | ------------ |
| Chrome          | 73+     | Full support |
| Edge            | 79+     | Full support |
| Firefox         | 82+     | Full support |
| Opera           | 60+     | Full support |
| Android Browser | 73+     | Full support |

### Partial Support

Limited Media Session features:

| Browser    | Version | Limitations                |
| ---------- | ------- | -------------------------- |
| Safari     | 15+     | No `seekto` action support |
| iOS Safari | 15+     | No `seekto` action support |

### No Support

Gracefully degrades - no errors thrown:

| Browser         | Behavior                            |
| --------------- | ----------------------------------- |
| Safari < 15     | Module returns early, no-op         |
| iOS Safari < 15 | Module returns early, no-op         |
| Older browsers  | Console warning, continues playback |

---

## Common Issues

### Issue: Media controls not showing on lock screen

**Solution:** Ensure metadata includes artwork and the audio is playing.

```typescript
// ❌ Missing artwork
const tracker = new AudioTracker("/audio.mp3", {
  mediaSession: { title: "Song" },
});

// ✅ Include artwork for better visibility
const tracker = new AudioTracker("/audio.mp3", {
  mediaSession: {
    title: "Song",
    artist: "Artist",
    artwork: [{ src: "/cover.jpg", sizes: "512x512" }],
  },
});
```

---

### Issue: Position not updating in system UI

**Solution:** Ensure audio has `duration` loaded before playing.

```typescript
tracker.init({
  onDurationChange: (duration) => {
    console.log("Duration loaded:", duration);
    // Position state updates automatically after this
  },
});
```

---

### Issue: Artwork not displaying

**Causes:**

- Artwork URL not accessible
- CORS restrictions
- Unsupported image format

**Solution:**

```typescript
// ✅ Use absolute URLs and correct MIME types
artwork: [
  {
    src: "https://example.com/cover.jpg",
    sizes: "512x512",
    type: "image/jpeg",
  },
];

// ✅ Ensure images allow cross-origin access
// Set proper CORS headers on image server
```

---

### Issue: Seek actions not working

**Safari/iOS limitation:** The `seekto` action is not supported.

**Solution:** Use `seekforward` and `seekbackward` as alternatives.

```typescript
// These work on all platforms:
navigator.mediaSession.setActionHandler("seekforward", (details) => {
  tracker.forward(details.seekOffset || 10);
});

navigator.mediaSession.setActionHandler("seekbackward", (details) => {
  tracker.backward(details.seekOffset || 10);
});
```

---

### Issue: Console warnings about unsupported actions

**This is normal.** The module attempts to register all actions and warns if any are unsupported. Your app will continue working.

```typescript
// Expected warning on Safari:
// Media Session action "seekto" not supported
```

---

## Best Practices

### Artwork Guidelines

- Provide multiple sizes (96x96, 192x192, 512x512)
- Use square images
- Prefer JPEG or PNG formats
- Keep file sizes under 500KB
- Use HTTPS URLs for secure contexts

### Metadata Updates

```typescript
// ✅ Update metadata when track changes
function changeTrack(newTrack) {
  tracker.updateMediaSessionMetadata({
    title: newTrack.title,
    artist: newTrack.artist,
    artwork: newTrack.artwork,
  });

  // Load new audio source
  tracker.getAudioElement().src = newTrack.url;
}
```

### Testing

```typescript
// Check Media Session support before relying on it
if ("mediaSession" in navigator) {
  console.log("Media Session supported");
} else {
  console.log("Media Session not available - fallback UI recommended");
}
```

---

## Related Documentation

- **[Main AudioTracker Documentation](https://github.com/tvicky7x/audio-tracker#readme)**
- **[Timestamp Module](https://github.com/tvicky7x/audio-tracker/blob/main/docs/timestamp.md)**
- **[MDN: Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API)**

---

**Made with ❤️ by T Vicky**

**Repository:** [github.com/tvicky7x/audio-tracker](https://github.com/tvicky7x/audio-tracker)
