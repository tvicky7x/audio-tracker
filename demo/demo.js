const DEMO_AUDIO = "/demo/assets/phonk-demo.mp3";

// Check Media Session support
const statusEl = document.getElementById("media-session-status");
if ("mediaSession" in navigator) {
  statusEl.innerHTML =
    '<strong style="color: #10b981;">✓ Supported</strong> (Try media keys!)';
} else {
  statusEl.innerHTML =
    '<strong style="color: #ef4444;">✗ Not supported</strong>';
}

// Initialize audio
const audio = new Audio(DEMO_AUDIO);
audio.preload = "metadata";

// Setup Media Session
if ("mediaSession" in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: "Sample Audio",
    artist: "AudioTracker Demo",
    album: "Demo Album",
    artwork: [
      {
        src: "/demo/assets/phonk-96.jpg",
        sizes: "96x96",
        type: "image/jpeg",
      },
      {
        src: "/demo/assets/phonk-256.jpg",
        sizes: "256x256",
        type: "image/jpeg",
      },
    ],
  });
}

// Format time helper
const formatTime = (secs) => {
  if (!secs || isNaN(secs)) return "0:00";
  const mins = Math.floor(secs / 60);
  const secs2 = Math.floor(secs % 60);
  return `${mins}:${secs2 < 10 ? "0" : ""}${secs2}`;
};

// Update play/pause icon
function updatePlayIcon(isPlaying) {
  const icon = document.getElementById("play-icon");

  if (isPlaying) {
    // Play icon (triangle)
    icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  } else {
    // Pause icon (two bars)
    icon.innerHTML =
      '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  }
}

// Event listeners
audio.addEventListener("loadedmetadata", () => {
  document.getElementById("duration").textContent = formatTime(audio.duration);
  document.getElementById("seek-slider").max = audio.duration;
});

audio.addEventListener("timeupdate", () => {
  const currentTime = audio.currentTime;
  const duration = audio.duration;

  // Update time display
  document.getElementById("current-time").textContent = formatTime(currentTime);

  // Update slider value
  document.getElementById("seek-slider").value = currentTime;

  // Update progress fill
  if (duration > 0) {
    const percentage = (currentTime / duration) * 100;
    document.getElementById("progress-fill").style.width = percentage + "%";
  }
});

audio.addEventListener("progress", () => {
  if (audio.buffered.length > 0 && audio.duration > 0) {
    const buffered = audio.buffered.end(audio.buffered.length - 1);
    const percentage = (buffered / audio.duration) * 100;
    document.getElementById("buffer-bar").style.width = percentage + "%";
  }
});

audio.addEventListener("play", () => {
  updatePlayIcon(false);
});

audio.addEventListener("pause", () => {
  updatePlayIcon(true);
});

// Controls
document.getElementById("play-pause-btn").addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
});

document.getElementById("seek-slider").addEventListener("input", (e) => {
  audio.currentTime = e.target.value;
});

// Volume slider with gradient fill
const volumeSlider = document.getElementById("volume-slider");

const updateVolumeGradient = () => {
  const value = volumeSlider.value;
  const percentage = value;
  volumeSlider.style.background = `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percentage}%, var(--border) ${percentage}%, var(--border) 100%)`;
};

volumeSlider.addEventListener("input", (e) => {
  audio.volume = e.target.value / 100;
  document.getElementById("volume-value").textContent = e.target.value;
  updateVolumeGradient();
});

// Initialize volume gradient
updateVolumeGradient();

document.getElementById("speed-select").addEventListener("change", (e) => {
  audio.playbackRate = parseFloat(e.target.value);
});

document.getElementById("loop-checkbox").addEventListener("change", (e) => {
  audio.loop = e.target.checked;
});

// Tabs
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const tabName = tab.dataset.tab;

    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));

    tab.classList.add("active");
    document
      .querySelector(`[data-content="${tabName}"]`)
      .classList.add("active");
  });
});

// Initialize icon
updatePlayIcon(true);
