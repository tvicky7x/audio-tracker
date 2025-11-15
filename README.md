# 🎵 audio-tracker

> A headless JavaScript library that gives you full control over web audio — playback, tracking, and Media Session integration made simple.

[![npm version](https://img.shields.io/npm/v/audio-tracker.svg?style=flat-square)](https://www.npmjs.com/package/audio-tracker)
[![npm downloads](https://img.shields.io/npm/dm/audio-tracker.svg?style=flat-square)](https://www.npmjs.com/package/audio-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://github.com/tvicky7x/audio-tracker/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

**[🎮 Live Demo](https://tvicky7x.github.io/audio-tracker/)** | **[📖 Documentation](https://github.com/tvicky7x/audio-tracker#-api-documentation)** | **[💾 Installation](https://github.com/tvicky7x/audio-tracker#-installation)**

---

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Modules](#-modules)
- [Usage Examples](#-usage-examples)
- [Browser Support](#-browser-support)
- [Common Issues](#-common-issues)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- 🎯 **TypeScript First** - Full type definitions included, no @types needed
- 🎵 **Complete Audio Control** - Play, pause, seek, volume, speed control
- 🔄 **Media Session API** - Native lock screen and media key controls
- 📱 **Cross-Platform** - Works on desktop and mobile browsers
- 🎨 **Framework Agnostic** - Use with React, Vue, Angular, or vanilla JS
- ⚡ **Flexible Input** - Accept URL strings or existing HTMLAudioElement
- 🪝 **Rich Event System** - 18+ callbacks for all audio events
- 🎮 **Zero Dependencies** - Pure TypeScript, no external dependencies
- 📦 **Lightweight** - Minimal footprint, tree-shakeable
- 🎧 **Headless** - No UI, just audio control logic
- 🧩 **Modular Architecture** - Extend with Media Session and Timestamp modules

---

## 📦 Installation

### npm

```bash
npm install audio-tracker
```

### yarn

```bash
yarn add audio-tracker
```

### pnpm

```bash
pnpm add audio-tracker
```

### CDN

```
<script src="https://unpkg.com/audio-tracker@1.2.3/dist/index.js"></script>
```

---

## 🚀 Quick Start

```typescript
import AudioTracker, { mediaSessionModule } from "audio-tracker";

// Create tracker with audio URL and options
const tracker = new AudioTracker("/path/to/audio.mp3", {
  preload: "metadata",
  loop: false,
  muted: false,
  autoplay: false,
  volume: 80,
});

// Optional: Add lock screen controls with one line
tracker.use(mediaSessionModule);

// Initialize with callbacks
tracker.init({
  onPlay: () => console.log("▶️ Playing"),
  onPause: () => console.log("⏸️ Paused"),
  onTimeUpdate: (time) => console.log(`⏱️ ${time}s`),
  onDurationChange: (duration) => console.log(`📏 Duration: ${duration}s`),
});

// Control playback
tracker.play();
tracker.pause();
tracker.seekTo(30); // Seek to 30 seconds
tracker.setVolume(80); // 80% volume
tracker.setPlaybackRate(1.5); // 1.5x speed
```

---

## 📚 API Documentation

### Constructor

```typescript
new AudioTracker(
  audioSource: string | HTMLAudioElement,
  options?: AudioTrackerOptions
)
```

#### Parameters

| Parameter     | Type                         | Description                              |
| ------------- | ---------------------------- | ---------------------------------------- |
| `audioSource` | `string \| HTMLAudioElement` | Audio file URL or existing audio element |
| `options`     | `AudioTrackerOptions`        | Configuration options (optional)         |

#### Options Interface

```typescript
interface AudioTrackerOptions {
  preload?: "none" | "metadata" | "auto";
  loop?: boolean;
  muted?: boolean;
  autoplay?: boolean;
  crossOrigin?: "anonymous" | "use-credentials" | null;
  volume?: number; // 0-100
}
```

---

### Methods

All methods available on the AudioTracker instance.

| Method                  | Parameters                              | Returns            | Description                              |
| ----------------------- | --------------------------------------- | ------------------ | ---------------------------------------- |
| **Initialization**      |
| `init`                  | `callbacks: AudioCallbacks`             | `AudioTracker`     | Initialize tracker with event callbacks  |
| `use`                   | `module: AudioModule`                   | `AudioTracker`     | Extend functionality with a module       |
| **Playback Controls**   |
| `play`                  | none                                    | `Promise<void>`    | Start audio playback                     |
| `pause`                 | none                                    | `void`             | Pause audio playback                     |
| `togglePlay`            | none                                    | `Promise<void>`    | Toggle between play and pause states     |
| `seekTo`                | `time: number`                          | `void`             | Seek to specific time in seconds         |
| `forward`               | `seconds?: number`                      | `void`             | Skip forward (default: 10 seconds)       |
| `backward`              | `seconds?: number`                      | `void`             | Skip backward (default: 10 seconds)      |
| `isPlaying`             | none                                    | `boolean`          | Check if audio is currently playing      |
| **Volume Controls**     |
| `setVolume`             | `value: number`                         | `void`             | Set volume level (0-100)                 |
| `getVolume`             | none                                    | `number`           | Get current volume (0-100)               |
| `toggleMute`            | none                                    | `boolean`          | Toggle mute state, returns new state     |
| `setMuted`              | `muted: boolean`                        | `void`             | Set mute state directly                  |
| `isMuted`               | none                                    | `boolean`          | Check if audio is muted                  |
| **Playback Speed**      |
| `setPlaybackRate`       | `rate: number`                          | `void`             | Set playback speed (0.25 - 4.0)          |
| `getPlaybackRate`       | none                                    | `number`           | Get current playback speed               |
| **Audio Attributes**    |
| `setLoop`               | `loop: boolean`                         | `void`             | Enable or disable looping                |
| `isLooping`             | none                                    | `boolean`          | Check if looping is enabled              |
| `setAutoplay`           | `autoplay: boolean`                     | `void`             | Set autoplay attribute                   |
| `getAutoplay`           | none                                    | `boolean`          | Get autoplay state                       |
| `setCrossOrigin`        | `crossOrigin: string \| null`           | `void`             | Set CORS settings                        |
| `getCrossOrigin`        | none                                    | `string \| null`   | Get CORS setting                         |
| `setPreload`            | `preload: string`                       | `void`             | Set preload strategy                     |
| `getPreload`            | none                                    | `string`           | Get preload strategy                     |
| **State & Information** |
| `getDuration`           | none                                    | `number`           | Get total audio duration in seconds      |
| `getCurrentTime`        | none                                    | `number`           | Get current playback position in seconds |
| `getTimeRemaining`      | none                                    | `number`           | Get remaining time in seconds            |
| `getReadyState`         | none                                    | `number`           | Get ready state (0-4)                    |
| `getNetworkState`       | none                                    | `number`           | Get network state (0-3)                  |
| **Utilities**           |
| `formatTime`            | `seconds: number`                       | `string`           | Format seconds to MM:SS format           |
| `getAudioElement`       | none                                    | `HTMLAudioElement` | Get underlying audio element             |
| `subscribe`             | `eventName: string, callback: Function` | `void`             | Subscribe to DOM events                  |
| `unsubscribe`           | `eventName: string, callback: Function` | `void`             | Unsubscribe from DOM events              |
| `destroy`               | none                                    | `void`             | Clean up and remove all listeners        |

#### Method Examples

```typescript
// Initialization
tracker.init({ onPlay: () => console.log("Playing") });
tracker.use(mediaSessionModule);

// Playback Controls
await tracker.play();
tracker.pause();
await tracker.togglePlay();
tracker.seekTo(45);
tracker.forward(30);
tracker.backward(15);
const playing = tracker.isPlaying();

// Volume Controls
tracker.setVolume(75);
const volume = tracker.getVolume();
const muted = tracker.toggleMute();
tracker.setMuted(true);
const isMuted = tracker.isMuted();

// Playback Speed
tracker.setPlaybackRate(1.5);
const rate = tracker.getPlaybackRate();

// Audio Attributes
tracker.setLoop(true);
const looping = tracker.isLooping();
tracker.setAutoplay(false);
const autoplay = tracker.getAutoplay();
tracker.setCrossOrigin("anonymous");
const cors = tracker.getCrossOrigin();
tracker.setPreload("metadata");
const preload = tracker.getPreload();

// State & Information
const duration = tracker.getDuration();
const currentTime = tracker.getCurrentTime();
const remaining = tracker.getTimeRemaining();
const readyState = tracker.getReadyState();
const networkState = tracker.getNetworkState();

// Utilities
const formatted = tracker.formatTime(125); // "2:05"
const audioEl = tracker.getAudioElement();
tracker.subscribe("play", () => console.log("Playing"));
tracker.unsubscribe("play", handler);
tracker.destroy();
```

---

### Callbacks

All callbacks are optional. Choose which events to listen to.

```typescript
interface AudioCallbacks {
  // Playback events
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onPlaying?: () => void;

  // Time events
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onSeeking?: (time: number) => void;

  // Loading events
  onBufferChange?: (bufferedTime: number) => void;
  onBufferPercentageChange?: (percentage: number) => void;
  onWaiting?: () => void;
  onCanPlay?: () => void;
  onLoadStart?: () => void;
  onStalled?: () => void;

  // Control events
  onRateChange?: (rate: number) => void;
  onVolumeChange?: (volume: number) => void;
  onMuteChange?: (muted: boolean) => void;

  // Error handling
  onError?: (error: MediaError | null) => void;
}
```

#### Callback Reference

| Callback                   | Parameters                  | Description                                       |
| -------------------------- | --------------------------- | ------------------------------------------------- |
| `onPlay`                   | none                        | Fires when audio starts playing                   |
| `onPause`                  | none                        | Fires when audio pauses                           |
| `onEnded`                  | none                        | Fires when audio playback ends                    |
| `onPlaying`                | none                        | Fires when playback resumes after buffering       |
| `onTimeUpdate`             | `currentTime: number`       | Fires continuously during playback (~4 times/sec) |
| `onDurationChange`         | `duration: number`          | Fires when audio duration becomes available       |
| `onSeeking`                | `time: number`              | Fires when seeking starts                         |
| `onBufferChange`           | `bufferedTime: number`      | Fires when buffer progress changes (in seconds)   |
| `onBufferPercentageChange` | `percentage: number`        | Fires when buffer progress changes (0-100%)       |
| `onWaiting`                | none                        | Fires when playback stops due to buffering        |
| `onCanPlay`                | none                        | Fires when enough data is loaded to play          |
| `onLoadStart`              | none                        | Fires when browser starts loading audio           |
| `onStalled`                | none                        | Fires when network stalls                         |
| `onRateChange`             | `rate: number`              | Fires when playback speed changes                 |
| `onVolumeChange`           | `volume: number`            | Fires when volume changes (0-100)                 |
| `onMuteChange`             | `muted: boolean`            | Fires when mute state changes                     |
| `onError`                  | `error: MediaError \| null` | Fires when an error occurs                        |

---

## 🧩 Modules

AudioTracker supports optional modules to extend functionality.

### Media Session Module

Integrates with browser's Media Session API for lock screen controls, media keys, and notification center integration.

```typescript
import AudioTracker, { mediaSessionModule } from "audio-tracker";

const tracker = new AudioTracker("/audio.mp3");
tracker.use(mediaSessionModule);

// Update metadata dynamically
tracker.updateMediaSessionMetadata?.({
  title: "New Song",
  artist: "Artist Name",
  artwork: [{ src: "/cover.jpg", sizes: "512x512", type: "image/jpeg" }],
});
```

**[View Media Session API Documentation →](https://github.com/tvicky7x/audio-tracker/blob/main/docs/media-session.md)**

### Timestamp Module

Track audio segments, subsegments, and speakers in real-time. Perfect for podcasts, interviews, and chaptered content.

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
        text: "Introduction",
      },
    ],
    gapBehavior: "persist-previous",
  },
});

tracker.use(timestampModule);

tracker.init({
  onSegmentChange: (segment) => console.log("Segment:", segment),
  onSpeakerChange: (speaker) => console.log("Speaker:", speaker),
});

// Seek to segment by ID
tracker.seekToSegmentById?.("intro");
```

**[View Timestamp API Documentation →](https://github.com/tvicky7x/audio-tracker/blob/main/docs/timestamp.md)**

---

## 💡 Usage Examples

### Basic Usage

```typescript
import AudioTracker from "audio-tracker";

const tracker = new AudioTracker("/music.mp3");

tracker.init({
  onDurationChange: (duration) => {
    console.log(`Total duration: ${duration} seconds`);
  },
  onTimeUpdate: (currentTime) => {
    console.log(`Current time: ${currentTime} seconds`);
  },
});

tracker.play();
```

---

### React Integration

```typescript
import React, { useEffect, useRef, useState } from "react";
import AudioTracker from "audio-tracker";

function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const trackerRef = useRef<AudioTracker | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);

  useEffect(() => {
    trackerRef.current = new AudioTracker(audioUrl, {
      preload: "metadata",
      volume: 100,
    });

    trackerRef.current.init({
      onPlay: () => setIsPlaying(true),
      onPause: () => setIsPlaying(false),
      onTimeUpdate: (time) => setCurrentTime(time),
      onDurationChange: (dur) => setDuration(dur),
      onVolumeChange: (vol) => setVolume(vol),
    });

    return () => trackerRef.current?.destroy();
  }, [audioUrl]);

  const handlePlayPause = async () => {
    await trackerRef.current?.togglePlay();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    trackerRef.current?.seekTo(time);
  };

  return (
    <div>
      <button onClick={handlePlayPause}>
        {isPlaying ? "⏸️ Pause" : "▶️ Play"}
      </button>

      <div>
        {trackerRef.current?.formatTime(currentTime)} /
        {trackerRef.current?.formatTime(duration)}
      </div>

      <input
        type="range"
        min={0}
        max={duration}
        value={currentTime}
        onChange={handleSeek}
        step={0.1}
      />
    </div>
  );
}

export default AudioPlayer;
```

---

### Vue Integration

```vue
<template>
  <div class="audio-player">
    <button @click="togglePlayPause">
      {{ isPlaying ? "⏸️ Pause" : "▶️ Play" }}
    </button>

    <div>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>

    <input
      type="range"
      :min="0"
      :max="duration"
      v-model="currentTime"
      @input="handleSeek"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import AudioTracker from "audio-tracker";

const props = defineProps<{ audioUrl: string }>();

let tracker: AudioTracker | null = null;
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);

onMounted(() => {
  tracker = new AudioTracker(props.audioUrl, { preload: "metadata" });

  tracker.init({
    onPlay: () => (isPlaying.value = true),
    onPause: () => (isPlaying.value = false),
    onTimeUpdate: (time) => (currentTime.value = time),
    onDurationChange: (dur) => (duration.value = dur),
  });
});

onUnmounted(() => tracker?.destroy());

const togglePlayPause = async () => {
  await tracker?.togglePlay();
};

const handleSeek = (e: Event) => {
  const time = parseFloat((e.target as HTMLInputElement).value);
  tracker?.seekTo(time);
};

const formatTime = (seconds: number) => {
  return tracker?.formatTime(seconds) || "0:00";
};
</script>
```

---

### Using Existing Audio Element

```typescript
const audioElement = document.getElementById("myAudio") as HTMLAudioElement;

const tracker = new AudioTracker(audioElement);

tracker.init({
  onPlay: () => console.log("Playing from existing element"),
});
```

---

## 🌐 Browser Support

### Core Audio Features

✅ **Full Support** - All playback, volume, and speed controls

| Browser         | Minimum Version |
| --------------- | --------------- |
| Chrome          | 57+             |
| Firefox         | 52+             |
| Safari          | 11+             |
| Edge            | 79+             |
| Opera           | 44+             |
| iOS Safari      | 11+             |
| Android Browser | 67+             |

### Media Session API

⚠️ **Progressive Enhancement** - Gracefully degrades on older browsers

| Browser         | Media Session Support |
| --------------- | --------------------- |
| Chrome          | ✅ 73+                |
| Firefox         | ✅ 82+                |
| Safari          | ⚠️ 15+ (partial)      |
| Edge            | ✅ 79+                |
| Opera           | ✅ 60+                |
| iOS Safari      | ⚠️ 15+ (partial)      |
| Android Browser | ✅ 73+                |

---

## 🐛 Common Issues

### Issue: Audio doesn't play on mobile

**Solution:** Mobile browsers require user interaction before playing audio.

```typescript
// ❌ Won't work on mobile without user interaction
tracker.play();

// ✅ Works - triggered by user click
button.addEventListener("click", () => {
  tracker.play();
});
```

### Issue: TypeScript errors

**Solution:** Make sure you're using TypeScript 4.0+

```bash
npm install typescript@latest
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

### Development Setup

```bash
# Clone the repository
git clone git@github.com:tvicky7x/audio-tracker.git
cd audio-tracker

# Install dependencies
npm install

# Build the project
npm run build
```

### Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Build and test: `npm run build`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 📝 Repository

- **GitHub:** [https://github.com/tvicky7x/audio-tracker](https://github.com/tvicky7x/audio-tracker)
- **Issues:** [https://github.com/tvicky7x/audio-tracker/issues](https://github.com/tvicky7x/audio-tracker/issues)
- **npm:** [https://www.npmjs.com/package/audio-tracker](https://www.npmjs.com/package/audio-tracker)
- **Demo:** [https://tvicky7x.github.io/audio-tracker/](https://tvicky7x.github.io/audio-tracker/)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 T Vicky

---

## 💖 Support

If you find this package helpful, please consider:

- ⭐ Starring the repository on GitHub
- 🐛 Reporting bugs and issues
- 💡 Suggesting new features
- 📖 Improving documentation
- 🔀 Contributing code

---

**Made with ❤️ by T Vicky**

**Repository:** [github.com/tvicky7x/audio-tracker](https://github.com/tvicky7x/audio-tracker)
