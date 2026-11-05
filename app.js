// =============================================
//  KONFIGURASI
// =============================================
const YOUTUBE_ID = "vDcArOE2rUQ";

const EPISODES = [
  { ep: 1, title: "Episode 1", start: 0,    duration: 360 },
  { ep: 2, title: "Episode 2", start: 360,  duration: 360 },
  { ep: 3, title: "Episode 3", start: 720,  duration: 360 },
  { ep: 4, title: "Episode 4", start: 1080, duration: 360 },
  { ep: 5, title: "Episode 5", start: 1440, duration: 360 }
];

const dramas = [
  {
    title: "Drama Utama",
    genre: "Drama",
    description: "Drama pilihan yang dibagi menjadi beberapa episode.",
    poster: `https://img.youtube.com/vi/${YOUTUBE_ID}/maxresdefault.jpg`,
    rating: 4.8,
    year: 2024
  }
];

// =============================================
//  STATE
// =============================================
let ytReady = false;
let ytPlayer = null;
let currentDrama = null;
let currentEpisodeIndex = 0;
let rotation = 0;
let spinActive = false;
let loopEnabled = false;
let progressChecker = null;
let fallbackMode = false;

// =============================================
//  YOUTUBE API CALLBACK
//  (dipanggil OTOMATIS oleh YouTube API)
// =============================================
window.onYouTubeIframeAPIReady = function() {
  ytReady = true;
  console.log("✅ YouTube API ready");
};

// Kalau API belum ready saat dibutuhkan, tunggu max 5 detik
function waitForYT(callback, onFail) {
  if (ytReady || (typeof YT !== 'undefined' && YT.Player)) {
    ytReady = true;
    callback();
    return;
  }
  let tries = 0;
  const check = setInterval(() => {
    tries++;
    if (ytReady || (typeof YT !== 'undefined' && YT.Player)) {
      ytReady = true;
      clearInterval(check);
      callback();
    } else if (tries > 25) {  // 25 × 200ms = 5 detik
      clearInterval(check);
      onFail();
    }
  }, 200);
}

// =============================================
//  RENDER HOME
// =============================================
function renderHome() {
  const banner = document.getElementById("banner");
  banner.style.backgroundImage = `url(${dramas[0].poster})`;
  document.getElementById("banner-title").textContent = dramas[0].title;
  document.getElementById("banner-genre").textContent =
    `${dramas[0].genre} • ${dramas[0].year} • ⭐ ${dramas[0].rating}`;

  document.getElementById("drama-grid").innerHTML = dramas.map((d, i) => `
    <div class="card" onclick="openDetail(${i})">
      <img src="${d.poster}" alt="${d.title}"
           onerror="this.src='https://via.placeholder.com/400x600/1a1a2e/b388ff?text=Drama'" />
      <div class="card-info">
        <h4>${d.title}</h4>
        <span class="rating">⭐ ${d.rating}</span>
      </div>
    </div>
  `).join("");
}

// =============================================
//  NAVIGATION
// =============================================
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

function showHome() {
  destroyPlayer();
  showScreen("home-screen");
}

function openDetail(i) {
  currentDrama = dramas[i];
  document.getElementById("detail-poster").src = currentDrama.poster;
  document.getElementById("detail-title").textContent = currentDrama.title;
  document.getElementById("detail-rating").textContent = currentDrama.rating;
  document.getElementById("detail-year").textContent = currentDrama.year;
  document.getElementById("detail-genre").textContent = currentDrama.genre;
  document.getElementById("detail-desc").textContent = currentDrama.description;

  document.getElementById("episode-list").innerHTML =
    EPISODES.map((ep, i) => `
      <div class="episode-btn" onclick="playEpisode(${i})">
        <div><span class="ep-num">EP ${ep.ep}</span>${ep.title}</div>
        <span class="ep-time">${formatTime(ep.start)}</span>
      </div>
    `).join("");

  showScreen("detail-screen");
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// =============================================
//  PLAY EPISODE (dengan fallback)
// =============================================
function playEpisode(i) {
  currentEpisodeIndex = i;
  const ep = EPISODES[i];

  document.getElementById("video-title").textContent =
    `${ep.title} • ${currentDrama.title}`;

  document.getElementById("video-info").innerHTML = `
    <b style="color:#b388ff">${ep.title}</b><br>
    ${currentDrama.description}<br><br>
    <small style="color:#666">Episode ${i + 1} dari ${EPISODES.length}</small>
  `;

  // Reset rotate & spin
  rotation = 0;
  spinActive = false;
  document.getElementById("video-rotate-wrapper").style.transform = "rotate(0deg)";
  document.getElementById("video-spin-wrapper").classList.remove("spinning");
  document.getElementById("btn-spin").textContent = "🌀 Spin: OFF";
  document.getElementById("btn-spin").classList.remove("active");

  // Reset loading
  document.getElementById("loading-spinner").textContent = "⏳ Memuat video...";
  document.getElementById("loading-spinner").classList.remove("hidden");

  showScreen("video-screen");

  // Destroy player lama kalau ada
  if (ytPlayer && ytPlayer.destroy) {
    try { ytPlayer.destroy(); } catch (e) {}
  }
  ytPlayer = null;
  document.getElementById("yt-player").innerHTML = "";
  stopProgressChecker();

  // ⭐ Tunggu YT API, kalau gagal → fallback
  waitForYT(
    () => initYTPlayer(ep.start),  // success
    () => initFallbackIframe(ep)   // fail
  );
}

// =============================================
//  INIT PLAYER (YouTube API)
// =============================================
function initYTPlayer(startTime) {
  fallbackMode = false;
  ytPlayer = new YT.Player("yt-player", {
    height: "100%",
    width: "100%",
    videoId: YOUTUBE_ID,
    playerVars: {
      autoplay: 1,
      start: startTime,
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      controls: 1
    },
    events: {
      "onReady": (e) => {
        document.getElementById("loading-spinner").classList.add("hidden");
        e.target.playVideo();
      },
      "onStateChange": (e) => {
        if (e.data === YT.PlayerState.PLAYING) {
          document.getElementById("loading-spinner").classList.add("hidden");
        }
      },
      "onError": () => {
        document.getElementById("loading-spinner").textContent =
          "❌ Video gagal. Cek koneksi / embed disabled.";
        document.getElementById("loading-spinner").classList.remove("hidden");
      }
    }
  });
  startProgressChecker();
}

// =============================================
//  FALLBACK IFRAME (kalau API gagal load)
// =============================================
function initFallbackIframe(ep) {
  console.warn("⚠ Pakai fallback iframe");
  fallbackMode = true;
  document.getElementById("yt-player").innerHTML = `
    <iframe src="https://www.youtube.com/embed/${YOUTUBE_ID}?start=${ep.start}&autoplay=1&rel=0&modestbranding=1"
            frameborder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowfullscreen
            style="width:100%;height:100%;border:none;"></iframe>
  `;
  document.getElementById("loading-spinner").classList.add("hidden");
  // Fallback: timer manual buat auto-next (kurang akurat, tapi jalan)
  startFallbackTimer(ep);
}

function startFallbackTimer(ep) {
  stopProgressChecker();
  progressChecker = setTimeout(() => {
    if (loopEnabled) {
      playEpisode(currentEpisodeIndex);  // reload episode
    } else if (currentEpisodeIndex < EPISODES.length - 1) {
      playEpisode(currentEpisodeIndex + 1);
    } else {
      alert("🎬 Drama selesai!");
      closeVideo();
    }
  }, ep.duration * 1000);
}

// =============================================
//  DESTROY PLAYER
// =============================================
function destroyPlayer() {
  stopProgressChecker();
  if (ytPlayer && ytPlayer.destroy) {
    try { ytPlayer.destroy(); } catch (e) {}
  }
  ytPlayer = null;
  document.getElementById("yt-player").innerHTML = "";
  fallbackMode = false;
}

// =============================================
//  CLOSE / PREV / NEXT
// =============================================
function closeVideo() {
  destroyPlayer();
  showScreen("detail-screen");
}

function prevEpisode() {
  if (currentEpisodeIndex > 0) playEpisode(currentEpisodeIndex - 1);
  else alert("Episode pertama");
}

function nextEpisode() {
  if (currentEpisodeIndex < EPISODES.length - 1) playEpisode(currentEpisodeIndex + 1);
  else alert("Episode terakhir");
}

// =============================================
//  LOOP / ROTATE / SPIN / FULLSCREEN
// =============================================
function toggleLoop() {
  loopEnabled = !loopEnabled;
  const btn = document.getElementById("btn-loop");
  btn.textContent = `🔁 Loop: ${loopEnabled ? "ON" : "OFF"}`;
  btn.classList.toggle("active", loopEnabled);
}

function rotateVideo() {
  rotation = (rotation + 90) % 360;
  document.getElementById("video-rotate-wrapper").style.transform = `rotate(${rotation}deg)`;
}

function toggleSpin() {
  spinActive = !spinActive;
  const el = document.getElementById("video-spin-wrapper");
  const btn = document.getElementById("btn-spin");
  el.classList.toggle("spinning", spinActive);
  btn.textContent = `🌀 Spin: ${spinActive ? "ON" : "OFF"}`;
  btn.classList.toggle("active", spinActive);
}

function toggleFullscreen() {
  const el = document.querySelector(".video-container");
  if (el.requestFullscreen) el.requestFullscreen();
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}

// =============================================
//  PROGRESS CHECKER (auto-next & loop)
// =============================================
function startProgressChecker() {
  stopProgressChecker();
  progressChecker = setInterval(() => {
    if (!ytPlayer || !ytPlayer.getCurrentTime || fallbackMode) return;
    const current = ytPlayer.getCurrentTime();
    const ep = EPISODES[currentEpisodeIndex];
    if (!ep || !ep.duration) return;
    const end = ep.start + ep.duration;

    if (current >= end - 1) {
      if (loopEnabled) {
        ytPlayer.seekTo(ep.start, true);
        ytPlayer.playVideo();
      } else if (currentEpisodeIndex < EPISODES.length - 1) {
        playEpisode(currentEpisodeIndex + 1);
      } else {
        stopProgressChecker();
        setTimeout(() => { alert("🎬 Drama selesai!"); closeVideo(); }, 500);
      }
    }
  }, 1000);
}

function stopProgressChecker() {
  if (progressChecker) {
    clearInterval(progressChecker);
    clearTimeout(progressChecker);
    progressChecker = null;
  }
}

// =============================================
//  INIT
// =============================================
renderHome();

history.pushState({ screen: "home" }, "");
window.addEventListener("popstate", () => {
  const active = document.querySelector(".screen.active").id;
  if (active === "video-screen") closeVideo();
  else if (active === "detail-screen") showHome();
  history.pushState({ screen: "home" }, "");
});