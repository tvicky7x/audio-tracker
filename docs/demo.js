import AudioTracker from "../dist/index.js";

// Check Media Session support
const statusEl = document.getElementById("media-session-status");
statusEl.innerHTML =
  "mediaSession" in navigator
    ? '<strong style="color: #10b981;">✓ Supported</strong>'
    : '<strong style="color: #ef4444;">✗ Not supported</strong>';

// Initialize AudioTracker
const tracker = new AudioTracker("assets/phonk-demo.mp3", {
  preload: "metadata",
  volume: 100,
  mediaSession: {
    title: "Sample Audio",
    artist: "AudioTracker Demo",
    album: "Demo Album",
    artwork: [
      { src: "assets/phonk-96.jpg", sizes: "96x96", type: "image/jpeg" },
      { src: "assets/phonk-256.jpg", sizes: "256x256", type: "image/jpeg" },
    ],
  },
});

// Initialize with callbacks
tracker.init({
  onDurationChange: (duration) => {
    document.getElementById("duration").textContent =
      tracker.formatTime(duration);
    document.getElementById("seek-slider").max = duration;
  },
  onTimeUpdate: (time) => {
    document.getElementById("current-time").textContent =
      tracker.formatTime(time);
    document.getElementById("seek-slider").value = time;

    const duration = tracker.getDuration();
    if (duration > 0) {
      document.getElementById("progress-fill").style.width =
        (time / duration) * 100 + "%";
    }
  },
  onBufferChange: (buffered) => {
    const duration = tracker.getDuration();
    if (duration > 0) {
      document.getElementById("buffer-bar").style.width =
        (buffered / duration) * 100 + "%";
    }
  },
  onPlay: () => updatePlayIcon(false),
  onPause: () => updatePlayIcon(true),
});

// Update play/pause icon
function updatePlayIcon(showPlay) {
  document.getElementById("play-icon").innerHTML = showPlay
    ? '<path d="M8 5v14l11-7z"/>'
    : '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
}

// Controls
document.getElementById("play-btn").onclick = () => {
  tracker.isPlaying() ? tracker.pause() : tracker.play();
};

document.getElementById("forward-btn").onclick = () => tracker.forward(10);
document.getElementById("backward-btn").onclick = () => tracker.backward(10);

document.getElementById("seek-slider").oninput = (e) => {
  tracker.seekTo(parseFloat(e.target.value));
};

const volumeSlider = document.getElementById("volume");
volumeSlider.oninput = (e) => {
  const val = parseInt(e.target.value);
  tracker.setVolume(val);
  document.getElementById("volume-value").textContent = val;
};

document.getElementById("speed").onchange = (e) => {
  tracker.setPlaybackRate(parseFloat(e.target.value));
};

document.getElementById("loop").onchange = (e) => {
  tracker.setLoop(e.target.checked);
};

// Tabs
document.querySelectorAll(".tab").forEach((tab) => {
  tab.onclick = () => {
    const target = tab.dataset.tab;
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document
      .querySelector(`[data-content="${target}"]`)
      .classList.add("active");
  };
});

updatePlayIcon(true);
window.onbeforeunload = () => tracker.destroy();
