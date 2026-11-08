/* ============================================================
   SETTINGS
   ============================================================ */

// Exactly 6 months before today (Nov 8, 2026).
// Format: new Date(year, month-1, day, hours, minutes) — months are 0-indexed!
const START_DATE      = new Date(2026, 4, 8, 18, 0, 0); // May 8, 2026, 6:00 PM

const WATERMARK_TEXT  = 'Shannon & Muba';
const WATERMARK_ROWS  = 9;
const WATERMARK_COLS  = 5;
const WATERMARK_SPEED = 120;   // seconds per drift cycle
const MUSIC_VOLUME    = 0.45;
const GALLERY_SLIDE_INDEX = 6; // which slide holds the photo carousel

// --- The seven love notes (shown one at a time, no repeats) ---
const MESSAGES = [
  'My love for you will never disappear.',
  'You are the most beautiful girl in the world.',
  'You are my princess — and that\'s a fact.',
  'I love showering you — every single time.',
  'I enjoy every moment I get to give you a massage.',
  'Drying your hair after a shower is never a chore for me — I love doing it.',
  'Sleeping next to you is my favorite part of every day.'
];

/* ============================================================
   Watermark
   ============================================================ */
(function buildNamesBg() {
  const wrap = document.getElementById('names-bg');
  if (!wrap) return;
  const frag = document.createDocumentFragment();
  for (let r = 0; r < WATERMARK_ROWS; r++) {
    const row = document.createElement('div');
    row.className = 'names-row';
    for (let t = 0; t < 3; t++) {
      const track = document.createElement('div');
      track.className = 'names-track';
      for (let c = 0; c < WATERMARK_COLS; c++) {
        const span = document.createElement('span');
        span.textContent = WATERMARK_TEXT;
        track.appendChild(span);
      }
      row.appendChild(track);
    }
    frag.appendChild(row);
  }
  wrap.appendChild(frag);
  wrap.style.setProperty('--wm-speed', WATERMARK_SPEED + 's');
})();

/* ============================================================
   Counter
   ============================================================ */
const $days = document.getElementById('days');
const $hours = document.getElementById('hours');
const $minutes = document.getElementById('minutes');
const $seconds = document.getElementById('seconds');
const pad = n => String(n).padStart(2, '0');

function updateCounter() {
  let diff = Date.now() - START_DATE.getTime();
  if (diff < 0) diff = 0;
  const days = Math.floor(diff / 86400000); diff -= days * 86400000;
  const hours = Math.floor(diff / 3600000);  diff -= hours * 3600000;
  const minutes = Math.floor(diff / 60000);   diff -= minutes * 60000;
  const seconds = Math.floor(diff / 1000);
  $days.textContent = days;
  $hours.textContent = pad(hours);
  $minutes.textContent = pad(minutes);
  $seconds.textContent = pad(seconds);
}
updateCounter();
setInterval(updateCounter, 1000);

/* ============================================================
   Slideshow navigation
   ============================================================ */
const slides = document.querySelectorAll('.slide');
const dotsContainer = document.getElementById('dots');
let currentSlide = 0;

slides.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.className = 'dot';
  dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
  dot.addEventListener('click', () => goToSlide(i));
  dotsContainer.appendChild(dot);
});
const dots = dotsContainer.querySelectorAll('.dot');

function goToSlide(n) {
  if (n === currentSlide || n < 0 || n >= slides.length) return;
  slides[currentSlide].classList.remove('active');
  slides[n].classList.add('active');
  dots[currentSlide].classList.remove('active');
  dots[n].classList.add('active');
  currentSlide = n;
  resetAllNoButtons();
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

dots[0].classList.add('active');

document.querySelectorAll('[data-next]').forEach(btn => {
  btn.addEventListener('click', e => {
    const next = parseInt(btn.dataset.next, 10);
    if (isNaN(next)) return;
    if (btn.classList.contains('btn-yes')) {
      heartBurst(e.clientX, e.clientY);
      setTimeout(() => goToSlide(next), 400);
    } else {
      goToSlide(next);
    }
  });
});

// Restart handler — reset notes so a fresh run requires collecting again
const restartBtn = document.getElementById('restartBtn');
restartBtn.addEventListener('click', () => {
  resetNotes();
  goToSlide(0);
});

const slidesEl = document.getElementById('slides');
let touchStartX = 0, touchStartY = 0, touchActive = false;
slidesEl.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchActive = true;
}, { passive: true });
slidesEl.addEventListener('touchend', e => {
  if (!touchActive) return;
  touchActive = false;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    if (dx < 0) nextSlide(); else prevSlide();
  }
}, { passive: true });

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') {
    if (currentSlide === GALLERY_SLIDE_INDEX) nextPhoto(); else nextSlide();
  }
  if (e.key === 'ArrowLeft') {
    if (currentSlide === GALLERY_SLIDE_INDEX) prevPhoto(); else prevSlide();
  }
});

/* ============================================================
   Photo carousel — one photo at a time
   ============================================================ */
const carouselViewport = document.getElementById('carouselViewport');
const carouselTrack = document.getElementById('carouselTrack');
const carouselDotsEl = document.getElementById('carouselDots');
const PHOTO_COUNT = carouselTrack ? carouselTrack.children.length : 0;
let currentPhoto = 0;

function goToPhoto(n) {
  if (!carouselTrack || PHOTO_COUNT === 0) return;
  currentPhoto = ((n % PHOTO_COUNT) + PHOTO_COUNT) % PHOTO_COUNT;
  carouselTrack.style.transform = `translateX(-${currentPhoto * 100}%)`;
  carouselDotsEl.querySelectorAll('.carousel-dot').forEach((d, i) => {
    d.classList.toggle('active', i === currentPhoto);
  });
}
function nextPhoto() { goToPhoto(currentPhoto + 1); }
function prevPhoto() { goToPhoto(currentPhoto - 1); }

if (carouselTrack && PHOTO_COUNT) {
  for (let i = 0; i < PHOTO_COUNT; i++) {
    const d = document.createElement('button');
    d.className = 'carousel-dot';
    d.setAttribute('aria-label', `Photo ${i + 1}`);
    d.addEventListener('click', () => goToPhoto(i));
    carouselDotsEl.appendChild(d);
  }
  carouselDotsEl.querySelectorAll('.carousel-dot')[0].classList.add('active');

  document.getElementById('carouselPrev').addEventListener('click', prevPhoto);
  document.getElementById('carouselNext').addEventListener('click', nextPhoto);

  let carStartX = 0, carStartY = 0, carActive = false;
  carouselViewport.addEventListener('touchstart', e => {
    carStartX = e.touches[0].clientX;
    carStartY = e.touches[0].clientY;
    carActive = true;
    e.stopPropagation();
  }, { passive: true });
  carouselViewport.addEventListener('touchmove', e => {
    e.stopPropagation();
  }, { passive: true });
  carouselViewport.addEventListener('touchend', e => {
    e.stopPropagation();
    if (!carActive) return;
    carActive = false;
    const dx = e.changedTouches[0].clientX - carStartX;
    const dy = e.changedTouches[0].clientY - carStartY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nextPhoto(); else prevPhoto();
    }
  }, { passive: true });
}

/* ============================================================
   The "No" button — unclickable, dodges every hover/tap
   ============================================================ */
const NO_TEXTS = ['No', 'No 😅', 'Nice try', 'Catch me 😜', 'Nope', 'Are you sure?', 'Try harder', 'Only yes 🥺'];
const NO_FADE_AT = 8;
const DODGE_EMOJIS = ['🥺', '😅', '😜', '🙈', '😳', '🤭'];

function dodgeNo(btn) {
  const attempts = (parseInt(btn.dataset.attempts, 10) || 0) + 1;
  btn.dataset.attempts = attempts;

  const maxX = 100, maxY = 55;
  const x = (Math.random() * 2 - 1) * maxX;
  const y = (Math.random() * 2 - 1) * maxY;
  const rot = Math.random() * 20 - 10;
  const scale = Math.max(0.55, 1 - attempts * 0.04);

  btn.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`;

  if (attempts < NO_TEXTS.length) {
    btn.textContent = NO_TEXTS[attempts];
  } else if (attempts >= NO_FADE_AT) {
    btn.style.opacity = String(Math.max(0, 1 - (attempts - NO_FADE_AT) * 0.25));
  }

  const rect = btn.getBoundingClientRect();
  const emoji = document.createElement('span');
  emoji.className = 'dodge-emoji';
  emoji.textContent = DODGE_EMOJIS[Math.floor(Math.random() * DODGE_EMOJIS.length)];
  emoji.style.left = (rect.left + rect.width / 2) + 'px';
  emoji.style.top  = (rect.top) + 'px';
  document.body.appendChild(emoji);
  setTimeout(() => emoji.remove(), 800);
}

function resetAllNoButtons() {
  document.querySelectorAll('.btn-no').forEach(btn => {
    btn.style.transform = '';
    btn.style.opacity = '';
    btn.textContent = 'No';
    delete btn.dataset.attempts;
  });
}

document.querySelectorAll('.btn-no').forEach(btn => {
  btn.addEventListener('mouseenter', () => dodgeNo(btn));
  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    dodgeNo(btn);
  });
  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    dodgeNo(btn);
  });
});

/* ============================================================
   Heart burst on Yes
   ============================================================ */
const BURST_GLYPHS = ['❤️', '💕', '💖', '✨', '💗', '💞'];
function heartBurst(x, y) {
  for (let i = 0; i < 10; i++) {
    const h = document.createElement('span');
    h.className = 'burst-heart';
    h.textContent = BURST_GLYPHS[Math.floor(Math.random() * BURST_GLYPHS.length)];
    h.style.left = x + 'px';
    h.style.top = y + 'px';
    h.style.setProperty('--tx', (Math.random() * 220 - 110) + 'px');
    h.style.setProperty('--ty', (-Math.random() * 200 - 40) + 'px');
    h.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1300);
  }
}

/* ============================================================
   Gallery lightbox
   ============================================================ */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const closeBtn = lightbox.querySelector('.lightbox-close');

document.querySelectorAll('.photo').forEach(photo => {
  photo.addEventListener('click', () => {
    const bg = getComputedStyle(photo).backgroundImage;
    if (!bg.startsWith('url(')) return;
    lightboxImg.src = bg.slice(5, -2);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  });
});

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
}
lightbox.addEventListener('click', closeLightbox);
closeBtn.addEventListener('click', e => { e.stopPropagation(); closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

/* ============================================================
   Love notes — collect all, then unlock Continue
   ============================================================ */
const loveBtn    = document.getElementById('loveBtn');
const msgEl      = document.getElementById('loveMessage');
const progressEl = document.getElementById('notesProgress');
const continueEl = document.getElementById('notesContinue');

const seenNotes = new Set();
const TOTAL_NOTES = MESSAGES.length;

function pickUnseenNote() {
  const remaining = [];
  for (let i = 0; i < TOTAL_NOTES; i++) {
    if (!seenNotes.has(i)) remaining.push(i);
  }
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)];
}

function updateNotesUI() {
  const seen = seenNotes.size;
  if (seen >= TOTAL_NOTES) {
    progressEl.textContent = `All ${TOTAL_NOTES} notes seen 💌`;
    continueEl.classList.add('show');
    loveBtn.disabled = true;
    loveBtn.classList.add('btn-disabled');
    loveBtn.textContent = 'All notes seen 💌';
  } else {
    progressEl.textContent = `${seen} of ${TOTAL_NOTES} notes`;
    continueEl.classList.remove('show');
  }
}

function resetNotes() {
  seenNotes.clear();
  msgEl.textContent = '';
  msgEl.classList.remove('show');
  loveBtn.disabled = false;
  loveBtn.classList.remove('btn-disabled');
  loveBtn.textContent = 'Get a note ❤️';
  updateNotesUI();
}

loveBtn.addEventListener('click', e => {
  if (navigator.vibrate) { try { navigator.vibrate(12); } catch (err) {} }
  heartBurst(e.clientX, e.clientY);

  const idx = pickUnseenNote();
  if (idx === null) return;
  seenNotes.add(idx);

  msgEl.classList.remove('show');
  setTimeout(() => {
    msgEl.textContent = MESSAGES[idx];
    msgEl.classList.add('show');
  }, 120);

  updateNotesUI();
});

// Start with a hidden Continue button and the "0 of 7 notes" label
updateNotesUI();

/* ============================================================
   Ambient floating hearts
   ============================================================ */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) {
  const symbols = ['❤️', '💕', '💖', '💗', '🌸', '💞'];
  const bg = document.getElementById('hearts-bg');
  const isPhone = window.innerWidth < 600;
  const MAX_HEARTS = isPhone ? 8 : 14;
  const SPAWN_MS = isPhone ? 1400 : 1000;

  function spawnHeart() {
    if (document.hidden) return;
    if (bg.childElementCount >= MAX_HEARTS) return;
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.fontSize = (12 + Math.random() * 20) + 'px';
    heart.style.animationDuration = (6 + Math.random() * 6) + 's';
    heart.style.opacity = 0.5 + Math.random() * 0.5;
    bg.appendChild(heart);
    setTimeout(() => heart.remove(), 13000);
  }
  for (let i = 0; i < 4; i++) setTimeout(spawnHeart, i * 400);
  setInterval(spawnHeart, SPAWN_MS);
}

/* ============================================================
   Music + top player
   ============================================================ */
const audio        = document.getElementById('bgMusic');
const splash       = document.getElementById('splash');
const player       = document.getElementById('player');
const playerToggle = document.getElementById('playerToggle');

audio.addEventListener('error', () => {
  player.classList.add('hidden');
});

function fadeInMusic() {
  const target = MUSIC_VOLUME;
  let v = 0;
  audio.volume = 0;
  const step = setInterval(() => {
    v += 0.03;
    if (v >= target) {
      audio.volume = target;
      clearInterval(step);
    } else {
      try { audio.volume = v; } catch (e) { clearInterval(step); }
    }
  }, 60);
}

function toggleMusic(e) {
  if (e) e.stopPropagation();
  if (navigator.vibrate) { try { navigator.vibrate(8); } catch (err) {} }

  if (audio.paused) {
    const p = audio.play();
    if (p && typeof p.then === 'function') p.catch(() => {});
  } else {
    audio.pause();
  }
}

splash.addEventListener('click', () => {
  const p = audio.play();
  if (p && typeof p.then === 'function') {
    p.then(() => fadeInMusic()).catch(() => player.classList.add('hidden'));
  }
  splash.classList.add('hidden');
  document.body.classList.remove('locked');
});

playerToggle.addEventListener('click', toggleMusic);
player.addEventListener('click', toggleMusic);

audio.addEventListener('play', () => {
  player.classList.add('playing');
  playerToggle.setAttribute('aria-pressed', 'true');
  playerToggle.setAttribute('aria-label', 'Pause music');
});
audio.addEventListener('pause', () => {
  player.classList.remove('playing');
  playerToggle.setAttribute('aria-pressed', 'false');
  playerToggle.setAttribute('aria-label', 'Play music');
});