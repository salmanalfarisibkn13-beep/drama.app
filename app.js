// =============================================
//  KONFIGURASI (Cuma ambil dari file data.json)
// =============================================
const API_URL = "data.json"; 

// =============================================
//  FETCH DATA
// =============================================
async function loadData() {
  try {
    // Ambil data dari file JSON statis
    const res = await fetch(API_URL);
    const json = await res.json();
    const dramas = json.dramas;
    
    renderFeed(dramas);
    console.log("✅ Data loaded:", dramas.length, "drama");
  } catch (err) {
    console.error("❌ Gagal load data:", err);
    document.getElementById("feed").innerHTML = `
      <div style="padding:40px;text-align:center;color:#f66;font-size:16px;">
        ❌ Gagal memuat data.json<br>
        <small style="color:#888;font-size:12px;">Pastikan file data.json ada di folder yang sama.</small>
      </div>`;
  }
}

// =============================================
//  RENDER FEED
// =============================================
function renderFeed(dramas) {
  const feed = document.getElementById("feed");
  
  feed.innerHTML = dramas.map((d, i) => `
    <div class="video-card">
      <video 
        src="${d.videoUrl}"
        loop 
        muted 
        playsinline 
        preload="auto"
        poster="${d.poster}"
        webkit-playsinline>
      </video>
      
      <div class="loading-overlay" id="load-${i}">
        <div style="font-size:32px;margin-bottom:12px;">⏳</div>
        <div>Memuat video...</div>
      </div>
      
      <div class="video-info">
        <span class="badge-ep">EP 1</span>
        <h3>${d.title}</h3>
        <p>${d.synopsis}</p>
      </div>
      
      <div class="video-actions">
        <button class="action-btn">🤍 <span>1.2K</span></button>
        <button class="action-btn">💬 <span>123</span></button>
        <button class="action-btn">↗️ <span>Share</span></button>
      </div>
    </div>
  `).join("");

  setupVideos();
}

// =============================================
//  SETUP VIDEO PLAYER
// =============================================
function setupVideos() {
  const videos = document.querySelectorAll(".video-card video");
  const loaders = document.querySelectorAll(".loading-overlay");

  videos.forEach((video, index) => {
    const loader = loaders[index];

    // Hilangkan loading kalau video berhasil dimuat
    video.addEventListener("loadeddata", () => {
      if (loader) loader.classList.add("hidden");
    });

    video.addEventListener("playing", () => {
      if (loader) loader.classList.add("hidden");
    });

    // Tap untuk unmute (karena autoplay harus muted)
    video.addEventListener("click", () => {
      video.muted = !video.muted;
      if (!video.muted) video.play().catch(() => {});
    });
  });

  // Auto-play saat di-scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    },
    { threshold: 0.6 }
  );

  videos.forEach((v) => observer.observe(v));
}

// =============================================
//  INIT
// =============================================
loadData();
