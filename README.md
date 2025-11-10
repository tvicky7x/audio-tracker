# 🎵 audio-tracker

> A headless JavaScript library that gives you full control over web audio — playback, tracking, and Media Session integration made simple.

[![npm version](https://img.shields.io/npm/v/audio-tracker.svg?style=flat-square)](https://www.npmjs.com/package/audio-tracker)
[![npm downloads](https://img.shields.io/npm/dm/audio-tracker.svg?style=flat-square)](https://www.npmjs.com/package/audio-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Usage Examples](#-usage-examples)
- [Advanced Features](#-advanced-features)
- [Browser Support](#-browser-support)
- [Common Issues](#-common-issues)
- [Changelog](#-changelog)
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
- 🪝 **Rich Event System** - 15+ callbacks for all audio events
- 🎮 **Zero Dependencies** - Pure TypeScript, no external dependencies
- 📦 **Lightweight** - Minimal footprint, tree-shakeable
- 🎧 **Headless** - No UI, just audio control logic
- 🎛️ **Core Audio Attributes** - Configure preload, loop, muted, autoplay, crossOrigin, and volume

---

## 📦 Installation

### npm

```
npm install audio-tracker
```

### yarn

```
yarn add audio-tracker
```

### pnpm

```
pnpm add audio-tracker
```

---

## 🚀 Quick Start

```
import AudioTracker from 'audio-tracker';

// Create tracker with audio URL and options
const tracker = new AudioTracker('/path/to/audio.mp3', {
  preload: 'metadata',
  loop: false,
  muted: false,
  autoplay: false,
  volume: 80,
  mediaSession: {
    title: 'My Song',
    artist: 'Artist Name',
    album: 'Album Name',
    artwork: [
      { src: '/artwork-96.png', sizes: '96x96', type: 'image/png' },
      { src: '/artwork-256.png', sizes: '256x256', type: 'image/png' }
    ]
  }
});

// Initialize with callbacks
tracker.init({
  onPlay: () => console.log('▶️ Playing'),
  onPause: () => console.log('⏸️ Paused'),
  onTimeUpdate: (time) => console.log(`⏱️ ${time}s`),
  onDurationChange: (duration) => console.log(`📏 Duration: ${duration}s`),
  onBufferChangePercentage: (percent) => console.log(`📊 Buffered: ${percent}%`)
});

// Control playback
tracker.play();
tracker.pause();
tracker.seekTo(30); // Seek to 30 seconds
tracker.setVolume(80); // 80% volume
tracker.setPlaybackRate(1.5); // 1.5x speed
tracker.setLoop(true); // Enable looping
```

---

## 📚 API Documentation

### Constructor

```
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

```
interface AudioTrackerOptions {
  preload?: 'none' | 'metadata' | 'auto';
  loop?: boolean;
  muted?: boolean;
  autoplay?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
  volume?: number; // 0-100
  mediaSession?: {
    title?: string;
    artist?: string;
    album?: string;
    artwork?: Array<{
      src: string;
      sizes: string;
      type: string;
    }>;
  };
}
```

---

### Methods

#### 🎮 Initialization

##### `init(callbacks: AudioTrackerCallbacks): void`

Initialize the tracker with event callbacks.

```
tracker.init({
  onPlay: () => console.log('Playing'),
  onPause: () => console.log('Paused')
});
```

---

#### ▶️ Playback Controls

##### `play(): Promise<void>`

Start audio playback. Returns a Promise that resolves when playback starts.

```
await tracker.play();
```

##### `pause(): void`

Pause audio playback.

```
tracker.pause();
```

##### `seekTo(time: number): void`

Seek to specific time in seconds.

```
tracker.seekTo(45); // Jump to 45 seconds
```

##### `isPlaying(): boolean`

Check if audio is currently playing.

```
if (tracker.isPlaying()) {
  console.log('Audio is playing');
}
```

---

#### 🔊 Volume Controls

##### `setVolume(value: number): void`

Set volume level (0-100).

```
tracker.setVolume(75); // 75% volume
```

##### `getVolume(): number`

Get current volume (0-100).

```
const volume = tracker.getVolume();
```

##### `toggleMute(): boolean`

Toggle mute state. Returns new mute state.

```
const isMuted = tracker.toggleMute();
```

##### `setMuted(muted: boolean): void`

Set mute state directly.

```
tracker.setMuted(true); // Mute
```

##### `isMuted(): boolean`

Check if audio is muted.

```
if (tracker.isMuted()) {
  console.log('Audio is muted');
}
```

---

#### ⚡ Playback Speed

##### `setPlaybackRate(rate: number): void`

Set playback speed (0.5 - 2.0). Common values:

- `0.5` - Half speed
- `0.75` - 75% speed
- `1.0` - Normal speed
- `1.25` - 25% faster
- `1.5` - 1.5x speed
- `2.0` - Double speed

```
tracker.setPlaybackRate(1.5); // 1.5x speed
```

##### `getPlaybackRate(): number`

Get current playback speed.

```
const speed = tracker.getPlaybackRate();
```

---

#### 🔁 Core Audio Attributes

##### `setLoop(loop: boolean): void`

Enable or disable audio looping.

```
tracker.setLoop(true); // Enable loop
```

##### `isLooping(): boolean`

Check if looping is enabled.

```
if (tracker.isLooping()) {
  console.log('Loop is on');
}
```

##### `setAutoplay(autoplay: boolean): void`

Set autoplay attribute.

```
tracker.setAutoplay(true);
```

##### `getAutoplay(): boolean`

Get autoplay state.

```
const autoplay = tracker.getAutoplay();
```

##### `setCrossOrigin(crossOrigin: 'anonymous' | 'use-credentials' | ''): void`

Set cross-origin attribute for CORS.

```
tracker.setCrossOrigin('anonymous');
```

##### `getCrossOrigin(): string | null`

Get cross-origin attribute.

```
const cors = tracker.getCrossOrigin();
```

##### `setPreload(preload: 'none' | 'metadata' | 'auto'): void`

Set preload strategy.

```
tracker.setPreload('auto');
```

##### `getPreload(): string`

Get preload strategy.

```
const preload = tracker.getPreload();
```

---

#### 🛠️ Utilities

##### `calculateTime(seconds: number): string`

Format seconds to MM:SS format.

```
tracker.calculateTime(125); // Returns "2:05"
tracker.calculateTime(3661); // Returns "61:01"
```

##### `getDuration(): number`

Get total audio duration in seconds.

```
const duration = tracker.getDuration();
```

##### `getCurrentTime(): number`

Get current playback position in seconds.

```
const currentTime = tracker.getCurrentTime();
```

##### `getReadyState(): number`

Get current ready state. Possible values:

- `0` - HAVE_NOTHING
- `1` - HAVE_METADATA
- `2` - HAVE_CURRENT_DATA
- `3` - HAVE_FUTURE_DATA
- `4` - HAVE_ENOUGH_DATA

```
const state = tracker.getReadyState();
```

##### `getNetworkState(): number`

Get network loading state. Possible values:

- `0` - NETWORK_EMPTY
- `1` - NETWORK_IDLE
- `2` - NETWORK_LOADING
- `3` - NETWORK_NO_SOURCE

```
const networkState = tracker.getNetworkState();
```

##### `destroy(): void`

Clean up and remove all event listeners. Call before removing the tracker.

```
tracker.destroy();
```

---

### Callbacks

All callbacks are optional. You can choose which events to listen to.

```
interface AudioTrackerCallbacks {
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
  onBufferChangePercentage?: (percentage: number) => void;
  onWaiting?: () => void;
  onCanPlay?: () => void;
  onLoadStart?: () => void;

  // Control events
  onRateChange?: (rate: number) => void;
  onVolumeChange?: (volume: { volume: number; muted: boolean }) => void;

  // Error handling
  onError?: (error: MediaError | null) => void;
}
```

#### Callback Details

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
| `onBufferChangePercentage` | `percentage: number`        | Fires when buffer progress changes (0-100%)       |
| `onWaiting`                | none                        | Fires when playback stops due to buffering        |
| `onCanPlay`                | none                        | Fires when enough data is loaded to play          |
| `onLoadStart`              | none                        | Fires when browser starts loading audio           |
| `onRateChange`             | `rate: number`              | Fires when playback speed changes                 |
| `onVolumeChange`           | `{ volume, muted }`         | Fires when volume or mute state changes           |
| `onError`                  | `error: MediaError \| null` | Fires when an error occurs                        |

---

### Type Definitions

AudioTracker is fully typed. Import types as needed:

```
import AudioTracker, {
  AudioTrackerCallbacks,
  AudioTrackerOptions
} from 'audio-tracker';
```

---

## 💡 Usage Examples

### Basic Usage

```
import AudioTracker from 'audio-tracker';

const tracker = new AudioTracker('/music.mp3');

tracker.init({
  onDurationChange: (duration) => {
    console.log(`Total duration: ${duration} seconds`);
  },
  onTimeUpdate: (currentTime) => {
    console.log(`Current time: ${currentTime} seconds`);
  }
});

// Play the audio
tracker.play();

// Pause after 5 seconds
setTimeout(() => tracker.pause(), 5000);
```

---

### React Integration

```
import React, { useEffect, useRef, useState, useCallback } from 'react';
import AudioTracker from 'audio-tracker';

function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const trackerRef = useRef<AudioTracker | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [bufferPercentage, setBufferPercentage] = useState(0);

  useEffect(() => {
    // Create tracker
    trackerRef.current = new AudioTracker(audioUrl, {
      preload: 'metadata',
      loop: false,
      volume: 100,
      mediaSession: {
        title: 'My Podcast Episode',
        artist: 'Podcast Host',
        artwork: [
          { src: '/artwork-256.png', sizes: '256x256', type: 'image/png' }
        ]
      }
    });

    // Initialize with callbacks
    trackerRef.current.init({
      onPlay: () => setIsPlaying(true),
      onPause: () => setIsPlaying(false),
      onTimeUpdate: (time) => setCurrentTime(time),
      onDurationChange: (dur) => setDuration(dur),
      onBufferChangePercentage: (percent) => setBufferPercentage(percent),
      onEnded: () => {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    });

    // Cleanup
    return () => {
      trackerRef.current?.destroy();
    };
  }, [audioUrl]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      trackerRef.current?.pause();
    } else {
      trackerRef.current?.play();
    }
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    trackerRef.current?.seekTo(time);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    trackerRef.current?.setVolume(vol);
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackRate(speed);
    trackerRef.current?.setPlaybackRate(speed);
  }, []);

  return (
    <div className="audio-player">
      <h2>Audio Player</h2>

      {/* Play/Pause Button */}
      <button onClick={handlePlayPause}>
        {isPlaying ? '⏸️ Pause' : '▶️ Play'}
      </button>

      {/* Time Display */}
      <div>
        {trackerRef.current?.calculateTime(currentTime)} /
        {trackerRef.current?.calculateTime(duration)}
      </div>

      {/* Seek Slider with Buffer Indicator */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            width: `${bufferPercentage}%`,
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.1)'
          }}
        />
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          step={0.1}
        />
      </div>

      {/* Volume Control */}
      <div>
        <label>Volume: {volume}%</label>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={handleVolumeChange}
        />
      </div>

      {/* Playback Speed */}
      <div>
        <label>Speed: {playbackRate}x</label>
        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
          <button
            key={speed}
            onClick={() => handleSpeedChange(speed)}
            disabled={playbackRate === speed}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
}

export default AudioPlayer;
```

---

### Vue Integration

```
<template>
  <div class="audio-player">
    <h2>Audio Player</h2>

    <button @click="togglePlayPause">
      {{ isPlaying ? '⏸️ Pause' : '▶️ Play' }}
    </button>

    <div>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>

    <input
      type="range"
      :min="0"
      :max="duration"
      v-model="currentTime"
      @input="handleSeek"
    />

    <div>
      <label>Volume: {{ volume }}%</label>
      <input
        type="range"
        :min="0"
        :max="100"
        v-model="volume"
        @input="handleVolumeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import AudioTracker from 'audio-tracker';

const props = defineProps<{
  audioUrl: string;
}>();

let tracker: AudioTracker | null = null;

const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(100);

onMounted(() => {
  tracker = new AudioTracker(props.audioUrl, {
    preload: 'metadata',
    volume: 100,
    mediaSession: {
      title: 'My Song',
      artist: 'Artist Name'
    }
  });

  tracker.init({
    onPlay: () => (isPlaying.value = true),
    onPause: () => (isPlaying.value = false),
    onTimeUpdate: (time) => (currentTime.value = time),
    onDurationChange: (dur) => (duration.value = dur)
  });
});

onUnmounted(() => {
  tracker?.destroy();
});

const togglePlayPause = () => {
  if (isPlaying.value) {
    tracker?.pause();
  } else {
    tracker?.play();
  }
};

const handleSeek = (e: Event) => {
  const time = parseFloat((e.target as HTMLInputElement).value);
  tracker?.seekTo(time);
};

const handleVolumeChange = (e: Event) => {
  const vol = parseFloat((e.target as HTMLInputElement).value);
  tracker?.setVolume(vol);
};

const formatTime = (seconds: number) => {
  return tracker?.calculateTime(seconds) || '0:00';
};
</script>
```

---

### Using Existing Audio Element

```
// Get existing audio element from DOM
const audioElement = document.getElementById('myAudio') as HTMLAudioElement;

// Create tracker from existing element
const tracker = new AudioTracker(audioElement, {
  mediaSession: {
    title: 'Track Title',
    artist: 'Artist Name'
  }
});

tracker.init({
  onPlay: () => console.log('Playing from existing element')
});
```

---

## 🎯 Advanced Features

### Show Loading State

```
tracker.init({
  onWaiting: () => {
    // Show loading spinner
    showSpinner();
  },
  onPlaying: () => {
    // Hide loading spinner
    hideSpinner();
  },
  onCanPlay: () => {
    // Audio is ready
    console.log('Ready to play');
  }
});
```

### Display Buffer Progress

```
tracker.init({
  onBufferChangePercentage: (percentage) => {
    console.log(`Buffered: ${percentage.toFixed(1)}%`);
    updateBufferBar(percentage);
  }
});
```

### Error Handling

```
tracker.init({
  onError: (error) => {
    if (error) {
      console.error('Audio error:', error.message);

      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          alert('Playback aborted');
          break;
        case error.MEDIA_ERR_NETWORK:
          alert('Network error');
          break;
        case error.MEDIA_ERR_DECODE:
          alert('Decoding error');
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          alert('Audio format not supported');
          break;
      }
    }
  }
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

> **Note:** On browsers without Media Session support, all core audio functionality works perfectly. You just won't have lock screen controls, media keys, or notification center integration.

---

## 🐛 Common Issues

### Issue: Audio doesn't play on mobile

**Solution:** Mobile browsers require user interaction before playing audio.

```
// ❌ Won't work on mobile without user interaction
tracker.play();

// ✅ Works - triggered by user click
button.addEventListener('click', () => {
  tracker.play();
});
```

### Issue: Media Session not showing

**Solution:** Ensure you're providing all required metadata.

```
// ❌ Missing artwork
mediaSession: {
  title: 'Song'
}

// ✅ Complete metadata
mediaSession: {
  title: 'Song Title',
  artist: 'Artist Name',
  album: 'Album Name',
  artwork: [
    { src: '/artwork.png', sizes: '256x256', type: 'image/png' }
  ]
}
```

### Issue: TypeScript errors

**Solution:** Make sure you're using TypeScript 4.0+

```
npm install typescript@latest
```

---

## 📝 Changelog

### v1.1.0 (2025-11-10)

**New Features:**

- ✨ Added `onBufferChangePercentage` callback for buffer progress (0-100%)
- ✨ Added core audio attribute options: `loop`, `muted`, `autoplay`, `crossOrigin`, `volume`
- ✨ Added `setAutoplay()` / `getAutoplay()` methods
- ✨ Added `setCrossOrigin()` / `getCrossOrigin()` methods
- ✨ Added `setPreload()` / `getPreload()` methods
- ✨ Added `getCurrentTime()` getter method
- ✨ Added `getDuration()` getter method

**Improvements:**

- 🎯 Core audio attributes now configurable at initialization
- 📚 Enhanced TypeScript type definitions
- 📖 Improved documentation with new examples

### v1.0.0 (2025-11-09)

**Initial Release:**

- 🎵 Complete audio playback control (play, pause, seek)
- 🔊 Volume control with mute support
- ⚡ Playback speed control
- 🔁 Loop control
- 🔄 Media Session API integration
- 🪝 14 event callbacks
- 🎯 TypeScript support with full type definitions
- 📱 Cross-platform compatibility
- 🎨 Framework agnostic
- 🎧 Headless design

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

### Development Setup

```
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

### Code Style

- Use TypeScript
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep the library headless (no UI dependencies)

---

## 📝 Repository

- **GitHub:** [https://github.com/tvicky7x/audio-tracker](https://github.com/tvicky7x/audio-tracker)
- **Issues:** [https://github.com/tvicky7x/audio-tracker/issues](https://github.com/tvicky7x/audio-tracker/issues)
- **npm:** [https://www.npmjs.com/package/audio-tracker](https://www.npmjs.com/package/audio-tracker)

---

## 📄 License

MIT License

Copyright (c) 2025 T Vicky

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 💖 Support

If you find this package helpful, please consider:

- ⭐ Starring the repository on GitHub
- 🐛 Reporting bugs and issues
- 💡 Suggesting new features
- 📖 Improving documentation
- 🔀 Contributing code

---

## 🙏 Acknowledgments

- Built with TypeScript 5.9.3
- Powered by Web Audio API and Media Session API
- Inspired by the need for headless, extensible audio control

---

**Made with ❤️ by T Vicky**

**Repository:** [github.com/tvicky7x/audio-tracker](https://github.com/tvicky7x/audio-tracker)
