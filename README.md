# audio-tracker

A headless JavaScript library that gives you full control over web audio — playback, tracking, and Media Session integration made simple.

[![npm version](https://img.shields.io/npm/v/audio-tracker.svg)](https://www.npmjs.com/package/audio-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**[🎮 Live Demo](https://tvicky7x.github.io/audio-tracker/)** • **[📦 npm Package](https://www.npmjs.com/package/audio-tracker)** • **[🐛 Report Bug](https://github.com/tvicky7x/audio-tracker/issues)** • **[✨ Request Feature](https://github.com/tvicky7x/audio-tracker/issues)**

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Usage Examples](#-usage-examples)
- [API Documentation](#-api-documentation)
- [TypeScript Support](#-typescript-support)
- [Framework Integration](#-framework-integration)
- [Media Session API](#-media-session-api)
- [Browser Compatibility](#-browser-compatibility)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎯 About

`audio-tracker` is a production-ready, headless audio library that gives developers complete control over web audio experiences. Unlike traditional audio players with bundled UI, audio-tracker is a powerful **state management solution for audio** that handles the complex parts—playback lifecycle, buffering states, error handling, and system-level media controls—while letting you build the interface your users deserve.

### Why audio-tracker?

- 🎨 **Headless Architecture:** No UI dependencies—bring your own design
- 🔄 **Framework Agnostic:** Works seamlessly with React, Vue, Svelte, Angular, or Vanilla JS
- 🎵 **Media Session API:** Built-in support for lock screen controls, media keys, and OS-level integration
- 📡 **Comprehensive Events:** 16+ callback hooks covering the entire playback lifecycle
- 🔷 **TypeScript First:** Fully typed with complete type definitions
- 🪶 **Lightweight:** Zero dependencies, minimal footprint
- 🛡️ **Production Ready:** Includes proper cleanup and memory leak prevention

---

## ✨ Features

- 🎮 **Playback Control:** Play, pause, seek, forward, backward
- 🔊 **Volume Management:** Set volume (0-100), mute/unmute, toggle
- ⚡ **Playback Speed:** Adjust speed from 0.25x to 4.0x
- 📊 **Progress Tracking:** Real-time time updates and buffering status
- 🎵 **Media Session API:** Lock screen controls, media keys, metadata display
- 🪝 **Event System:** Comprehensive callbacks for all audio events
- ⏱️ **Time Formatting:** Built-in time formatter (seconds to MM:SS)
- 🔍 **State Queries:** Check playback state, volume, duration, and more
- 🔁 **Loop & Autoplay:** Configurable looping and autoplay behavior
- 🌐 **CORS Support:** Configurable cross-origin settings
- 🚨 **Error Handling:** Detailed error callbacks
- 🧹 **Memory Safe:** Proper cleanup with destroy method

---

## 📦 Installation

### NPM

```
npm install audio-tracker
```

### Yarn

```
yarn add audio-tracker
```

### PNPM

```
pnpm add audio-tracker
```

### CDN

```
<script type="module">
  import AudioTracker from 'https://unpkg.com/audio-tracker@latest/dist/index.js';
</script>
```

---

## 🚀 Quick Start

```
import AudioTracker from 'audio-tracker';

// Create tracker instance
const tracker = new AudioTracker('path/to/audio.mp3', {
  volume: 75,
  preload: 'auto',
  mediaSession: {
    title: 'Song Title',
    artist: 'Artist Name',
    artwork: [{ src: 'cover.jpg', sizes: '512x512' }]
  }
});

// Initialize with event callbacks
tracker.init({
  onPlay: () => console.log('Playback started'),
  onPause: () => console.log('Playback paused'),
  onTimeUpdate: (currentTime) => {
    const progress = (currentTime / tracker.getDuration()) * 100;
    console.log(`Progress: ${progress.toFixed(2)}%`);
  },
  onError: (error) => console.error('Playback error:', error)
});

// Control playback
await tracker.play();
tracker.pause();
tracker.seekTo(30);

// Cleanup when done
tracker.destroy();
```

---

## 💡 Usage Examples

### Basic Setup

```
import AudioTracker from 'audio-tracker';

const tracker = new AudioTracker('audio.mp3', {
  volume: 50,
  preload: 'metadata',
  loop: false,
  autoplay: false
});

tracker.init({
  onDurationChange: (duration) => {
    console.log(`Total duration: ${tracker.formatTime(duration)}`);
  },
  onTimeUpdate: (time) => {
    console.log(`Current time: ${tracker.formatTime(time)}`);
  }
});

await tracker.play();
```

### With Existing Audio Element

```
const audioElement = document.querySelector('audio');
const tracker = new AudioTracker(audioElement);

tracker.init({
  onPlay: () => console.log('Playing'),
  onPause: () => console.log('Paused')
});
```

### Media Session Integration

```
const tracker = new AudioTracker('audio.mp3', {
  mediaSession: {
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    artwork: [
      { src: 'cover-96.png', sizes: '96x96', type: 'image/png' },
      { src: 'cover-128.png', sizes: '128x128', type: 'image/png' },
      { src: 'cover-256.png', sizes: '256x256', type: 'image/png' },
      { src: 'cover-512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
});

tracker.init({
  onPlay: () => console.log('Media Session activated')
});

await tracker.play();
```

**This enables:**

- 🔒 Lock screen media controls
- ⌨️ Media key support (keyboard play/pause/seek)
- 🔔 Notification center integration
- 💻 OS-level metadata display

---

## 📚 API Documentation

### 🏗️ Constructor

#### `new AudioTracker(audioSource, options?)`

Creates a new AudioTracker instance.

**Parameters:**

| Parameter     | Type                         | Description                              |
| ------------- | ---------------------------- | ---------------------------------------- |
| `audioSource` | `string \| HTMLAudioElement` | Audio file URL or existing audio element |
| `options`     | `AudioTrackerOptions`        | Configuration options (optional)         |

**Example:**

```
// With URL
const tracker = new AudioTracker('audio.mp3');

// With audio element
const audio = document.querySelector('audio');
const tracker = new AudioTracker(audio);
```

---

### ⚙️ Initialization Options

#### `AudioTrackerOptions`

| Option         | Type                             | Default      | Description                                       |
| -------------- | -------------------------------- | ------------ | ------------------------------------------------- |
| `preload`      | `"none" \| "metadata" \| "auto"` | `"metadata"` | Browser preload strategy                          |
| `loop`         | `boolean`                        | `false`      | Enable audio looping                              |
| `muted`        | `boolean`                        | `false`      | Mute on initialization                            |
| `autoplay`     | `boolean`                        | `false`      | Autoplay (subject to browser policies)            |
| `crossOrigin`  | `string`                         | `undefined`  | CORS policy: `"anonymous"` or `"use-credentials"` |
| `volume`       | `number`                         | `100`        | Initial volume (0-100)                            |
| `mediaSession` | `MediaSessionMetadata`           | `undefined`  | Media Session API metadata                        |

#### `MediaSessionMetadata`

| Property  | Type                    | Description             |
| --------- | ----------------------- | ----------------------- |
| `title`   | `string`                | Track title             |
| `artist`  | `string`                | Artist name             |
| `album`   | `string`                | Album name              |
| `artwork` | `MediaSessionArtwork[]` | Array of artwork images |

---

### 🪝 Event Callbacks

#### `tracker.init(callbacks)`

Register event callbacks to respond to audio events.

```
interface AudioTrackerCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onWaiting?: () => void;
  onPlaying?: () => void;
  onStalled?: () => void;
  onSeeking?: (seekTime: number) => void;
  onBufferChange?: (bufferedTime: number) => void;
  onBufferPercentageChange?: (percentage: number) => void;
  onVolumeChange?: (data: VolumeChangeData) => void;
  onRateChange?: (rate: number) => void;
  onError?: (error: MediaError | null) => void;
}
```

**Callback Reference:**

| Callback                   | Parameters                           | Description                                 | Icon |
| -------------------------- | ------------------------------------ | ------------------------------------------- | ---- |
| `onPlay`                   | None                                 | Fired when playback starts                  | ▶️   |
| `onPause`                  | None                                 | Fired when playback pauses                  | ⏸️   |
| `onEnded`                  | None                                 | Fired when playback completes               | ⏹️   |
| `onTimeUpdate`             | `currentTime: number`                | Fired continuously during playback          | ⏱️   |
| `onDurationChange`         | `duration: number`                   | Fired when duration metadata loads          | 📏   |
| `onLoadStart`              | None                                 | Fired when browser starts loading           | 📥   |
| `onCanPlay`                | None                                 | Fired when enough data is buffered          | ✅   |
| `onWaiting`                | None                                 | Fired when playback stalls (buffering)      | ⏳   |
| `onPlaying`                | None                                 | Fired when playback resumes after buffering | ▶️   |
| `onStalled`                | None                                 | Fired on network stall                      | 🌐   |
| `onSeeking`                | `seekTime: number`                   | Fired when seek operation starts            | ⏩   |
| `onBufferChange`           | `bufferedTime: number`               | Fired when buffered time updates            | 📊   |
| `onBufferPercentageChange` | `percentage: number`                 | Fired when buffer percentage changes        | 📈   |
| `onVolumeChange`           | `{ volume: number, muted: boolean }` | Fired on volume/mute change                 | 🔊   |
| `onRateChange`             | `rate: number`                       | Fired when playback rate changes            | ⚡   |
| `onError`                  | `error: MediaError \| null`          | Fired on playback error                     | 🚨   |

**Example:**

```
tracker.init({
  onTimeUpdate: (time) => {
    document.querySelector('.current-time').textContent = tracker.formatTime(time);
  },
  onDurationChange: (duration) => {
    document.querySelector('.total-time').textContent = tracker.formatTime(duration);
  },
  onBufferPercentageChange: (percent) => {
    document.querySelector('.buffer-bar').style.width = `${percent}%`;
  }
});
```

---

### 🎮 Playback Control

#### `play(): Promise<void>`

▶️ Starts or resumes audio playback.

```
await tracker.play();
```

#### `pause(): void`

⏸️ Pauses audio playback.

```
tracker.pause();
```

#### `seekTo(time: number): void`

⏩ Seeks to a specific time position.

```
tracker.seekTo(45); // Jump to 45 seconds
```

#### `forward(seconds?: number): void`

⏭️ Skips forward by specified seconds (default: 10).

```
tracker.forward(15); // Skip forward 15 seconds
```

#### `backward(seconds?: number): void`

⏮️ Skips backward by specified seconds (default: 10).

```
tracker.backward(5); // Rewind 5 seconds
```

---

### 🔊 Volume Control

#### `setVolume(value: number): void`

🔊 Sets the audio volume (0-100).

```
tracker.setVolume(75);
```

#### `getVolume(): number`

🔊 Returns the current volume level (0-100).

```
const currentVolume = tracker.getVolume();
```

#### `toggleMute(): boolean`

🔇 Toggles mute state.

```
const isMuted = tracker.toggleMute();
```

#### `setMuted(muted: boolean): void`

🔇 Sets mute state explicitly.

```
tracker.setMuted(true);
```

#### `isMuted(): boolean`

🔇 Checks if audio is currently muted.

```
if (tracker.isMuted()) {
  console.log('Audio is muted');
}
```

---

### 🔍 State & Information

#### `isPlaying(): boolean`

▶️ Checks if audio is currently playing.

```
const playing = tracker.isPlaying();
```

#### `getDuration(): number`

📏 Returns total audio duration in seconds.

```
const duration = tracker.getDuration();
```

#### `getCurrentTime(): number`

⏱️ Returns current playback position in seconds.

```
const currentTime = tracker.getCurrentTime();
```

#### `getTimeRemaining(): number`

⏳ Returns remaining playback time in seconds.

```
const remaining = tracker.getTimeRemaining();
```

#### `getReadyState(): number`

📊 Returns the ready state of the audio element.

**Return values:**

- `0`: HAVE_NOTHING
- `1`: HAVE_METADATA
- `2`: HAVE_CURRENT_DATA
- `3`: HAVE_FUTURE_DATA
- `4`: HAVE_ENOUGH_DATA

#### `getNetworkState(): number`

🌐 Returns the network loading state.

**Return values:**

- `0`: NETWORK_EMPTY
- `1`: NETWORK_IDLE
- `2`: NETWORK_LOADING
- `3`: NETWORK_NO_SOURCE

---

### ⚙️ Configuration

#### `setPlaybackRate(rate: number): void`

⚡ Sets the playback speed (0.25-4.0).

```
tracker.setPlaybackRate(1.5); // 1.5x speed
```

#### `getPlaybackRate(): number`

⚡ Returns the current playback rate.

```
const rate = tracker.getPlaybackRate();
```

#### `setLoop(loop: boolean): void`

🔁 Enables or disables audio looping.

```
tracker.setLoop(true);
```

#### `isLooping(): boolean`

🔁 Checks if looping is enabled.

```
const looping = tracker.isLooping();
```

#### `setAutoplay(autoplay: boolean): void`

▶️ Sets autoplay behavior.

```
tracker.setAutoplay(true);
```

#### `getAutoplay(): boolean`

▶️ Returns autoplay state.

```
const autoplay = tracker.getAutoplay();
```

#### `setCrossOrigin(crossOrigin: string): void`

🌐 Sets CORS policy.

```
tracker.setCrossOrigin('anonymous');
```

#### `getCrossOrigin(): string | null`

🌐 Returns current CORS policy.

```
const cors = tracker.getCrossOrigin();
```

#### `setPreload(preload: "none" | "metadata" | "auto"): void`

📥 Sets preload strategy.

```
tracker.setPreload('auto');
```

#### `getPreload(): string`

📥 Returns current preload strategy.

```
const preload = tracker.getPreload();
```

---

### 🛠️ Utility Methods

#### `formatTime(seconds: number): string`

⏱️ Formats seconds to MM:SS display format.

```
tracker.formatTime(125);   // Returns: "2:05"
tracker.formatTime(3661);  // Returns: "61:01"
tracker.formatTime(45);    // Returns: "0:45"
```

#### `destroy(): void`

🧹 Cleans up event listeners and resources. **Always call this to prevent memory leaks.**

```
useEffect(() => {
  const tracker = new AudioTracker('audio.mp3');
  tracker.init({ /* callbacks */ });

  return () => {
    tracker.destroy(); // Cleanup
  };
}, []);
```

---

## 🔷 TypeScript Support

`audio-tracker` is written in TypeScript and includes complete type definitions.

### Type Imports

```
import AudioTracker, {
  type AudioTrackerOptions,
  type AudioTrackerCallbacks,
  type MediaSessionMetadata,
  type MediaSessionArtwork,
  type VolumeChangeData
} from 'audio-tracker';
```

### Type Definitions

```
interface AudioTrackerOptions {
  preload?: "none" | "metadata" | "auto";
  loop?: boolean;
  muted?: boolean;
  autoplay?: boolean;
  crossOrigin?: string;
  volume?: number;
  mediaSession?: MediaSessionMetadata;
}

interface MediaSessionMetadata {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: MediaSessionArtwork[];
}

interface MediaSessionArtwork {
  src: string;
  sizes?: string;
  type?: string;
}

interface VolumeChangeData {
  volume: number;
  muted: boolean;
}

interface AudioTrackerCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onWaiting?: () => void;
  onPlaying?: () => void;
  onStalled?: () => void;
  onSeeking?: (seekTime: number) => void;
  onBufferChange?: (bufferedTime: number) => void;
  onBufferPercentageChange?: (percentage: number) => void;
  onVolumeChange?: (data: VolumeChangeData) => void;
  onRateChange?: (rate: number) => void;
  onError?: (error: MediaError | null) => void;
}
```

---

## 🔌 Framework Integration

### ⚛️ React Example

```
import { useEffect, useRef, useState } from 'react';
import AudioTracker from 'audio-tracker';

function AudioPlayer() {
  const trackerRef = useRef<AudioTracker | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const tracker = new AudioTracker('audio.mp3', {
      volume: 75,
      mediaSession: {
        title: 'My Song',
        artist: 'Artist Name'
      }
    });

    tracker.init({
      onPlay: () => setIsPlaying(true),
      onPause: () => setIsPlaying(false),
      onTimeUpdate: (time) => setCurrentTime(time),
      onDurationChange: (dur) => setDuration(dur),
      onError: (error) => console.error('Error:', error)
    });

    trackerRef.current = tracker;

    return () => {
      tracker.destroy();
    };
  }, []);

  const handlePlayPause = async () => {
    if (trackerRef.current) {
      if (isPlaying) {
        trackerRef.current.pause();
      } else {
        await trackerRef.current.play();
      }
    }
  };

  return (
    <div>
      <button onClick={handlePlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        onChange={(e) => trackerRef.current?.seekTo(parseFloat(e.target.value))}
      />
      <span>
        {trackerRef.current?.formatTime(currentTime)} /
        {trackerRef.current?.formatTime(duration)}
      </span>
    </div>
  );
}
```

### 💚 Vue Example

```
<template>
  <div>
    <button @click="togglePlay">
      {{ isPlaying ? 'Pause' : 'Play' }}
    </button>
    <input
      type="range"
      :min="0"
      :max="duration"
      :value="currentTime"
      @input="handleSeek"
    />
    <span>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AudioTracker from 'audio-tracker';

const tracker = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);

onMounted(() => {
  tracker.value = new AudioTracker('audio.mp3', {
    volume: 75,
    mediaSession: {
      title: 'My Song',
      artist: 'Artist Name'
    }
  });

  tracker.value.init({
    onPlay: () => (isPlaying.value = true),
    onPause: () => (isPlaying.value = false),
    onTimeUpdate: (time) => (currentTime.value = time),
    onDurationChange: (dur) => (duration.value = dur)
  });
});

onUnmounted(() => {
  tracker.value?.destroy();
});

const togglePlay = async () => {
  if (isPlaying.value) {
    tracker.value.pause();
  } else {
    await tracker.value.play();
  }
};

const handleSeek = (e) => {
  tracker.value.seekTo(parseFloat(e.target.value));
};

const formatTime = (seconds) => {
  return tracker.value?.formatTime(seconds) || '0:00';
};
</script>
```

### 🟨 Vanilla JavaScript

```
import AudioTracker from 'audio-tracker';

const tracker = new AudioTracker('audio.mp3', {
  volume: 75,
  mediaSession: {
    title: 'My Song',
    artist: 'Artist Name'
  }
});

const playBtn = document.querySelector('#play-btn');
const progressBar = document.querySelector('#progress');
const currentTimeEl = document.querySelector('#current-time');
const durationEl = document.querySelector('#duration');

tracker.init({
  onPlay: () => {
    playBtn.textContent = 'Pause';
  },
  onPause: () => {
    playBtn.textContent = 'Play';
  },
  onTimeUpdate: (time) => {
    currentTimeEl.textContent = tracker.formatTime(time);
    const progress = (time / tracker.getDuration()) * 100;
    progressBar.style.width = `${progress}%`;
  },
  onDurationChange: (duration) => {
    durationEl.textContent = tracker.formatTime(duration);
  }
});

playBtn.addEventListener('click', async () => {
  if (tracker.isPlaying()) {
    tracker.pause();
  } else {
    await tracker.play();
  }
});

window.addEventListener('beforeunload', () => {
  tracker.destroy();
});
```

---

## 🎵 Media Session API

The Media Session API enables system-level media controls. When configured, users can control playback from:

- 🔒 **Lock screen** media controls
- 🔔 **Notification center** widgets
- ⌨️ **Media keys** on keyboards
- 🎧 **Bluetooth headphones** controls
- 💻 **OS media hubs** (Windows, macOS, mobile)

### Configuration

```
const tracker = new AudioTracker('audio.mp3', {
  mediaSession: {
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    artwork: [
      { src: 'cover-96.png', sizes: '96x96', type: 'image/png' },
      { src: 'cover-128.png', sizes: '128x128', type: 'image/png' },
      { src: 'cover-256.png', sizes: '256x256', type: 'image/png' },
      { src: 'cover-512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
});
```

### Supported Actions

- ▶️ Play
- ⏸️ Pause
- ⏩ Seek Forward
- ⏪ Seek Backward
- 🎯 Seek To (scrubbing)
- ⏹️ Stop

### Browser Support

- ✅ Chrome/Edge 73+
- ✅ Firefox 82+
- ✅ Safari 15+
- ✅ Mobile browsers (Android/iOS)

---

## 🌐 Browser Compatibility

`audio-tracker` works in all modern browsers that support:

- HTML5 Audio API
- ES6+ JavaScript
- Promises

**Supported Browsers:**

- ✅ Chrome/Edge 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Opera 47+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile, Samsung Internet)

**Note:** Media Session API availability varies by browser. The library gracefully degrades when not supported.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit your changes:** `git commit -m 'Add amazing feature'`
4. **Push to the branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Setup

```
# Clone the repository
git clone https://github.com/tvicky7x/audio-tracker.git
cd audio-tracker

# Install dependencies
npm install

# Build the project
npm run build

# Run demo locally
npm run demo:prepare
```

### 🐛 Reporting Issues

If you encounter any bugs or have feature requests, please [open an issue](https://github.com/tvicky7x/audio-tracker/issues) with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment details

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**T Vicky**

- 🐙 GitHub: [@tvicky7x](https://github.com/tvicky7x)
- 📦 npm: [audio-tracker](https://www.npmjs.com/package/audio-tracker)

---

## 💬 Support

- 📖 **Documentation:** [Demo Site](https://tvicky7x.github.io/audio-tracker/)
- 🐛 **Issues:** [GitHub Issues](https://github.com/tvicky7x/audio-tracker/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/tvicky7x/audio-tracker/discussions)

If you find this project useful, consider giving it a ⭐ on [GitHub](https://github.com/tvicky7x/audio-tracker)!

---

**Built with ❤️ for the web audio community**
