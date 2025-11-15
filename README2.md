## 📚 API Documentation

...

### Methods

All methods available on the AudioTracker instance.

| Method                  | Parameters                              | Returns            | Description                              |
| ----------------------- | --------------------------------------- | ------------------ | ---------------------------------------- | ------------------------------------ |
| **Initialization**      |                                         |                    |                                          |
| `init`                  | `callbacks: AudioCallbacks`             | `AudioTracker`     | Initialize tracker with event callbacks  |
| `use`                   | `module: AudioModule`                   | `AudioTracker`     | Extend functionality with a module       |
| **Playback Controls**   |                                         |                    |                                          |
| `play`                  | none                                    | `Promise<void>`    | Start audio playback                     |
| `pause`                 | none                                    | `void`             | Pause audio playback                     |
| `togglePlay`            | none                                    | `Promise<void>     | void`                                    | Toggle between play and pause states |
| `seekTo`                | `time: number`                          | `void`             | Seek to specific time in seconds         |
| `forward`               | `seconds?: number`                      | `void`             | Skip forward (default: 10 seconds)       |
| `backward`              | `seconds?: number`                      | `void`             | Skip backward (default: 10 seconds)      |
| `isPlaying`             | none                                    | `boolean`          | Check if audio is currently playing      |
| **Volume Controls**     |                                         |                    |                                          |
| `setVolume`             | `value: number`                         | `void`             | Set volume level (0-100)                 |
| `getVolume`             | none                                    | `number`           | Get current volume (0-100)               |
| `toggleMute`            | none                                    | `boolean`          | Toggle mute state, returns new state     |
| `setMuted`              | `muted: boolean`                        | `void`             | Set mute state directly                  |
| `isMuted`               | none                                    | `boolean`          | Check if audio is muted                  |
| **Playback Speed**      |                                         |                    |                                          |
| `setPlaybackRate`       | `rate: number`                          | `void`             | Set playback speed (0.25 - 4.0)          |
| `getPlaybackRate`       | none                                    | `number`           | Get current playback speed               |
| **Audio Attributes**    |                                         |                    |                                          |
| `setLoop`               | `loop: boolean`                         | `void`             | Enable or disable looping                |
| `isLooping`             | none                                    | `boolean`          | Check if looping is enabled              |
| `setAutoplay`           | `autoplay: boolean`                     | `void`             | Set autoplay attribute                   |
| `getAutoplay`           | none                                    | `boolean`          | Get autoplay state                       |
| `setCrossOrigin`        | `crossOrigin: string \| null`           | `void`             | Set CORS settings                        |
| `getCrossOrigin`        | none                                    | `string \| null`   | Get CORS setting                         |
| `setPreload`            | `preload: string`                       | `void`             | Set preload strategy                     |
| `getPreload`            | none                                    | `string`           | Get preload strategy                     |
| **State & Information** |                                         |                    |                                          |
| `getDuration`           | none                                    | `number`           | Get total audio duration in seconds      |
| `getCurrentTime`        | none                                    | `number`           | Get current playback position in seconds |
| `getTimeRemaining`      | none                                    | `number`           | Get remaining time in seconds            |
| `getReadyState`         | none                                    | `number`           | Get ready state (0-4)                    |
| `getNetworkState`       | none                                    | `number`           | Get network state (0-3)                  |
| **Utilities**           |                                         |                    |                                          |
| `formatTime`            | `seconds: number`                       | `string`           | Format seconds to MM:SS format           |
| `getAudioElement`       | none                                    | `HTMLAudioElement` | Get underlying audio element             |
| `subscribe`             | `eventName: string, callback: Function` | `void`             | Subscribe to DOM events                  |
| `unsubscribe`           | `eventName: string, callback: Function` | `void`             | Unsubscribe from DOM events              |
| `destroy`               | none                                    | `void`             | Clean up and remove all listeners        |

---

### togglePlay Method

```typescript
/**
 * Toggle playback state between play and pause.
 * @returns Promise that resolves when playback starts, or void if paused.
 */
public togglePlay(): Promise<void> | void {
  if (this.isPlaying()) {
    this.pause();
  } else {
    return this.play();
  }
}
```
