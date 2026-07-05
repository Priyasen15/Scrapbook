const pages = Array.from(document.querySelectorAll(".page"));
const nextButtons = Array.from(document.querySelectorAll(".nextBtn"));
const restartButton = document.getElementById("restart");
const progressText = document.getElementById("pageNumber");
const progressDots = document.getElementById("progressDots");
const bookShell = document.getElementById("bookShell");
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
const envelope = document.getElementById("envelope");
const letterContent = document.getElementById("letterContent");
const petalLayer = document.getElementById("petalLayer");
const canvas = document.getElementById("celebrationCanvas");
const ctx = canvas.getContext("2d");

let currentPage = 0;
let musicStarted = false;
let targetVolume = 0.38;
let audioContext;
let finalTriggered = false;
let closeTimer;
let fireworksTimer;
let crackerTimer;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function buildDots() {
  progressDots.innerHTML = "";
  pages.forEach((page, index) => {
    const dot = document.createElement("button");
    dot.className = "progress-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to ${page.dataset.label || `page ${index + 1}`}`);
    dot.addEventListener("click", () => showPage(index));
    progressDots.appendChild(dot);
  });
}

function updateProgress() {
  const label = pages[currentPage].dataset.label || `Page ${currentPage + 1}`;
  progressText.textContent = label;
  Array.from(progressDots.children).forEach((dot, index) => {
    dot.classList.toggle("active", index === currentPage);
  });
}

function playTone(frequency = 520, duration = 0.06, type = "triangle") {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    osc.connect(gain).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration + 0.02);
  } catch {
    // Silent fallback for browsers that block Web Audio before interaction.
  }
}

function fadeMusic(to, duration = 700) {
  if (!bgMusic) return;
  const from = bgMusic.volume || 0;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    bgMusic.volume = from + (to - from) * eased;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function startMusic() {
  if (!bgMusic || musicStarted) return;
  bgMusic.volume = 0;
  bgMusic.play()
    .then(() => {
      musicStarted = true;
      musicToggle.classList.add("is-playing");
      fadeMusic(targetVolume, 900);
    })
    .catch(() => {
      musicToggle.classList.remove("is-playing");
    });
}

function toggleMusic() {
  if (!bgMusic) return;
  if (bgMusic.paused) {
    bgMusic.play().then(() => {
      musicStarted = true;
      musicToggle.classList.add("is-playing");
      fadeMusic(targetVolume, 500);
    }).catch(() => {});
  } else {
    fadeMusic(0, 420);
    setTimeout(() => {
      bgMusic.pause();
      musicToggle.classList.remove("is-playing");
    }, 430);
  }
}

function staggerPhotos(page) {
  const photos = page.querySelectorAll(".pinterest-grid img, .polaroid");
  photos.forEach((photo, index) => {
    photo.classList.remove("show");
    photo.style.animationDelay = `${index * 95}ms`;
    requestAnimationFrame(() => photo.classList.add("show"));
  });
}

function showPage(index) {
  if (index < 0 || index >= pages.length || index === currentPage) return;
  const previousPage = pages[currentPage];
  const nextPage = pages[index];

  clearTimeout(closeTimer);
  previousPage.classList.remove("active");
  previousPage.classList.add("turning-left");

  setTimeout(() => {
    pages.forEach((page) => page.classList.remove("active", "turning-left"));
    nextPage.classList.add("active");
    currentPage = index;
    updateProgress();
    staggerPhotos(nextPage);
    handlePageEffects(index);
  }, 260);
}

function nextPage() {
  startMusic();
  playTone(560, 0.05);
  burstFromElement(document.activeElement);
  if (currentPage < pages.length - 1) showPage(currentPage + 1);
}

function handlePageEffects(index) {
  targetVolume = index >= pages.length - 2 ? 0.2 : 0.38;
  if (musicStarted && !bgMusic.paused) fadeMusic(targetVolume, 650);

  if (index === pages.length - 1 && !finalTriggered) {
    finalTriggered = true;
    launchConfetti();
    launchCrackers();
    startFireworks();
    closeTimer = setTimeout(() => bookShell.classList.add("closing"), 9500);
  } else if (index !== pages.length - 1) {
    stopFireworks();
    stopCrackers();
    finalTriggered = false;
    bookShell.classList.remove("closing");
  }
}

function openEnvelope() {
  playTone(430, 0.08, "sine");
  envelope.classList.add("open");
  setTimeout(() => {
    envelope.style.display = "none";
    letterContent.classList.add("show");
  }, 520);
}

function burstFromElement(element) {
  if (!element || !element.getBoundingClientRect) return;
  const rect = element.getBoundingClientRect();
  const colors = ["#b85c6d", "#d6a84f", "#71846f", "#547083", "#fffaf0"];

  for (let i = 0; i < 16; i += 1) {
    const piece = document.createElement("span");
    piece.className = "burst-piece";
    piece.style.background = colors[i % colors.length];
    piece.style.left = `${rect.left + rect.width / 2}px`;
    piece.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(piece);

    const angle = Math.random() * Math.PI * 2;
    const distance = 45 + Math.random() * 80;
    piece.animate([
      { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
      {
        transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(${180 + Math.random() * 260}deg)`,
        opacity: 0
      }
    ], {
      duration: 760 + Math.random() * 180,
      easing: "cubic-bezier(.2,.8,.2,1)"
    });

    setTimeout(() => piece.remove(), 1000);
  }
}

function createPetal() {
  if (!petalLayer) return;
  const petal = document.createElement("span");
  petal.className = "petal";
  petal.style.left = `${Math.random() * 100}vw`;
  petal.style.opacity = `${0.35 + Math.random() * 0.45}`;
  petal.style.setProperty("--drift", `${Math.random() * 160 - 80}px`);
  petal.style.animationDuration = `${8 + Math.random() * 7}s`;
  petalLayer.appendChild(petal);
  setTimeout(() => petal.remove(), 16000);
}

function launchConfetti() {
  const colors = ["#b85c6d", "#d6a84f", "#71846f", "#547083", "#f5d6a9", "#fffaf0"];
  for (let i = 0; i < 240; i += 1) {
    const piece = document.createElement("span");
    piece.className = "burst-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.top = "-24px";
    piece.style.background = colors[i % colors.length];
    piece.style.width = `${6 + Math.random() * 8}px`;
    piece.style.height = `${8 + Math.random() * 14}px`;
    document.body.appendChild(piece);

    piece.animate([
      { transform: "translateY(0) rotate(0deg)", opacity: 1 },
      {
        transform: `translate(${Math.random() * 220 - 110}px, ${window.innerHeight + 80}px) rotate(${360 + Math.random() * 720}deg)`,
        opacity: 0.88
      }
    ], {
      duration: 2800 + Math.random() * 1800,
      easing: "cubic-bezier(.18,.74,.32,1)"
    });

    setTimeout(() => piece.remove(), 4800);
  }
}

function crackerFountain(originX, originY, direction = 1) {
  const colors = ["#fff6a0", "#f7db8f", "#e9833b", "#b85c6d", "#92ab9e", "#a8c3cf", "#fffaf0"];

  for (let i = 0; i < 34; i += 1) {
    const spark = document.createElement("span");
    spark.className = "burst-piece cracker-spark";
    spark.style.left = `${originX}px`;
    spark.style.top = `${originY}px`;
    spark.style.background = colors[i % colors.length];
    spark.style.width = `${4 + Math.random() * 5}px`;
    spark.style.height = `${8 + Math.random() * 11}px`;
    document.body.appendChild(spark);

    const spread = (Math.random() * 190 + 60) * direction;
    const lift = -(120 + Math.random() * 270);
    const spin = 260 + Math.random() * 520;

    spark.animate([
      { transform: "translate(0, 0) rotate(0deg) scale(1)", opacity: 1 },
      {
        transform: `translate(${spread}px, ${lift}px) rotate(${spin}deg) scale(${0.25 + Math.random() * 0.45})`,
        opacity: 0
      }
    ], {
      duration: 850 + Math.random() * 650,
      easing: "cubic-bezier(.14,.76,.31,1)"
    });

    setTimeout(() => spark.remove(), 1600);
  }
}

function launchCrackers() {
  stopCrackers();
  const bottom = window.innerHeight - 22;
  crackerFountain(42, bottom, 1);
  crackerFountain(window.innerWidth - 42, bottom, -1);
  crackerTimer = setInterval(() => {
    const y = window.innerHeight - 22;
    crackerFountain(42 + Math.random() * 28, y, 1);
    crackerFountain(window.innerWidth - 42 - Math.random() * 28, y, -1);
  }, 520);

  setTimeout(stopCrackers, 5600);
}

function stopCrackers() {
  if (crackerTimer) clearInterval(crackerTimer);
  crackerTimer = null;
}

function drawFirework(x, y) {
  const colors = ["#f7db8f", "#b85c6d", "#92ab9e", "#a8c3cf", "#fffaf0"];
  const particles = Array.from({ length: 42 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 42;
    const speed = 1.5 + Math.random() * 3.2;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color: colors[index % colors.length]
    };
  });

  let frame = 0;
  function animateFirework() {
    frame += 1;
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.025;
      particle.life -= 0.018;
      ctx.globalAlpha = Math.max(particle.life, 0);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    if (frame < 58) requestAnimationFrame(animateFirework);
  }

  animateFirework();
}

function clearCanvasSoftly() {
  ctx.globalAlpha = 0.16;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.globalAlpha = 1;
}

function startFireworks() {
  stopFireworks();
  fireworksTimer = setInterval(() => {
    clearCanvasSoftly();
    drawFirework(
      window.innerWidth * (0.2 + Math.random() * 0.6),
      window.innerHeight * (0.14 + Math.random() * 0.36)
    );
    if (Math.random() > 0.45) {
      drawFirework(
        window.innerWidth * (0.15 + Math.random() * 0.7),
        window.innerHeight * (0.12 + Math.random() * 0.42)
      );
    }
  }, 420);
}

function stopFireworks() {
  if (fireworksTimer) clearInterval(fireworksTimer);
  fireworksTimer = null;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function replay() {
  playTone(500, 0.07);
  finalTriggered = false;
  stopFireworks();
  stopCrackers();
  bookShell.classList.remove("closing");
  envelope.style.display = "";
  envelope.classList.remove("open");
  letterContent.classList.remove("show");
  currentPage = 0;
  pages.forEach((page) => page.classList.remove("active", "turning-left"));
  pages[0].classList.add("active");
  updateProgress();
  staggerPhotos(pages[0]);
  bookShell.classList.remove("opening");
  requestAnimationFrame(() => bookShell.classList.add("opening"));
  if (musicStarted && !bgMusic.paused) fadeMusic(0.38, 600);
}

nextButtons.forEach((button) => button.addEventListener("click", nextPage));
restartButton.addEventListener("click", replay);
musicToggle.addEventListener("click", toggleMusic);
envelope.addEventListener("click", openEnvelope);
window.addEventListener("resize", resizeCanvas);

buildDots();
resizeCanvas();
updateProgress();
bookShell.classList.add("opening");
staggerPhotos(pages[0]);
setInterval(createPetal, 1300);
