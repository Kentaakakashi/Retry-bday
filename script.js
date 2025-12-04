/* =========================
   GLOBAL GLOW LAYER
========================= */
const screenGlow = document.createElement("div");
screenGlow.id = "screen-glow";
document.body.appendChild(screenGlow);

/* =========================
   AUDIO SYSTEM (NO RESTART BUG)
========================= */

const CLICK = new Audio("assets/click.mp3");
const MUSIC = new Audio("assets/music.mp3");
MUSIC.loop = true;
MUSIC.volume = 0.45;

let audioCtx = null;
let analyser = null;
let dataArray = null;
let beatInitialized = false;
let userUnlocked = false;

/* Restore time ONCE */
const savedTime = parseFloat(localStorage.getItem("bgTime") || "0");
if(savedTime > 0) MUSIC.currentTime = savedTime;

/* Try autoplay immediately */
tryPlay();

/* Fallback unlock on first user touch (for mobile) */
window.addEventListener("pointerdown", unlockOnce, { once: true });

function unlockOnce(){
  userUnlocked = true;
  tryPlay();
}

function tryPlay(){
  try{
    if(
      !location.pathname.includes("edit.html") &&
      !location.pathname.includes("recordings.html")
    ){
      MUSIC.play().catch(()=>{});
    }

    if(!audioCtx){
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(MUSIC);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);

      source.connect(analyser);
      analyser.connect(audioCtx.destination);
    }

    if(!beatInitialized){
      createBeatBorder();
      animateBeatBorder();
      beatInitialized = true;
    }
  }catch(e){}
}

/* Save time LIVE */
setInterval(()=>{
  try{
    localStorage.setItem("bgTime", MUSIC.currentTime);
  }catch(e){}
}, 1000);

/* =========================
   GLOBAL PAUSE BUTTON
========================= */
(function(){
  const btn = document.createElement("button");
  btn.id = "musicToggle";
  btn.innerHTML = "⏸";
  document.body.appendChild(btn);

  btn.addEventListener("click", ()=>{
    if(MUSIC.paused){
      MUSIC.play();
      btn.innerHTML = "⏸";
    }else{
      MUSIC.pause();
      btn.innerHTML = "▶";
    }
  });
})();

/* =========================
   CLICK SOUND + PARTICLES
========================= */
function playClick(){
  try{
    CLICK.currentTime = 0;
    CLICK.play();
  }catch(e){}
}

function spawnClickParticle(x, y){
  for(let i=0;i<8;i++){
    const p = document.createElement("div");
    p.className = "float-emoji";
    p.textContent = "✨";
    p.style.left = x + (Math.random()*60-30) + "px";
    p.style.top  = y + (Math.random()*60-30) + "px";
    p.style.animationDuration = "1s";
    document.body.appendChild(p);
    setTimeout(()=>p.remove(),1000);
  }
}

document.addEventListener("click", e=>{
  if(e.target.closest("a,button")){
    playClick();
    spawnClickParticle(e.clientX, e.clientY);
  }
});

/* =========================
   CURSOR SPARKLE
========================= */
(function(){
  const cur = document.createElement("div");
  cur.className = "cursor-spark";
  document.body.appendChild(cur);

  document.addEventListener("mousemove", e=>{
    cur.style.left = e.clientX + "px";
    cur.style.top = e.clientY + "px";
  });
})();

/* =========================
   FLOATING EMOJIS
========================= */
setInterval(()=>{
  const el = document.createElement("div");
  el.className = "float-emoji";
  el.textContent = ["💖","✨","🌸","🎀","💕"][Math.floor(Math.random()*5)];
  el.style.left = Math.random()*window.innerWidth + "px";
  el.style.bottom = "-40px";
  el.style.fontSize = 20 + Math.random()*30 + "px";
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),8000);
}, 700);

/* =========================
   TYPEWRITER WISH
========================= */
(function(){
  const area = document.getElementById("typed-area");
  const display = document.getElementById("typed-text");
  if(!area || !display) return;

  const raw = area.dataset.wish || display.textContent;
  display.textContent = "";
  let i = 0;

  function step(){
    if(i < raw.length){
      display.textContent += raw[i++];
      setTimeout(step, 30);
    }
  }
  step();
})();

/* =========================
   RECORDINGS PLAYER
========================= */
(function(){
  document.querySelectorAll(".recording-item").forEach(item=>{
    const btn = item.querySelector(".play-bubble");
    const audio = item.querySelector("audio");

    btn.addEventListener("click", ()=>{
      if(audio.paused){
        audio.play();
        btn.textContent = "❚❚";
      }else{
        audio.pause();
        btn.textContent = "▶";
      }
    });
  });
})();

/* =========================
   BEAT BORDER + GLOW (NO SHAKE)
========================= */
function createBeatBorder(){
  const border = document.createElement("div");
  border.id = "beat-border";

  ["top","bottom","left","right"].forEach(side=>{
    const row = document.createElement("div");
    row.className = `beat-row beat-${side}`;
    const count = side==="top"||side==="bottom"?48:24;

    for(let i=0;i<count;i++){
      row.appendChild(document.createElement("span"));
    }
    border.appendChild(row);
  });

  document.body.appendChild(border);
}

function animateBeatBorder(){
  if(!analyser) return;

  requestAnimationFrame(animateBeatBorder);
  analyser.getByteFrequencyData(dataArray);

  const bars = document.querySelectorAll(".beat-row span");

  // 🔊 Pick real bass (sub + kick)
  const bass =
    (dataArray[1] +
     dataArray[2] +
     dataArray[3]) / 3;

  // 🎨 Dynamic glow color
  const hue = (bass * 2.2) % 360;
  const glow = `hsl(${hue}, 100%, 60%)`;

  // ⚡ Beat flash trigger (only on peaks)
  if(bass > 145){
    screenGlow.classList.add("active");

    screenGlow.style.color = glow;
    screenGlow.style.boxShadow = `
      inset 0 0 120px ${glow},
      inset 0 0 260px ${glow}
    `;

    setTimeout(()=>{
      screenGlow.classList.remove("active");
      screenGlow.style.boxShadow = `inset 0 0 60px ${glow}`;
    }, 70); // flash duration
  }

  // 🎚️ Animate border bars smoothly
  bars.forEach((bar,i)=>{
    const v = dataArray[i % dataArray.length];
    const scale = Math.max(0.3, v / 110);

    bar.style.transform = `scaleY(${scale})`;
    bar.style.background = glow;
    bar.style.boxShadow = `
      0 0 ${8 + v/2}px ${glow}
    `;
  });
}

/* =========================
   EDIT + RECORDING PAGE MUTE
========================= */
if(
  location.pathname.includes("edit.html") ||
  location.pathname.includes("recordings.html")
){
  MUSIC.pause();
       }

/* =========================
   MEMORIES CAROUSEL – FIXED NEXT/PREV
========================= */
(function(){
  const carousel = document.querySelector(".carousel");
  if(!carousel) return;

  const track = carousel.querySelector(".slide-track");
  const slides = Array.from(track.children);
  const next = document.getElementById("nextSlide");
  const prev = document.getElementById("prevSlide");

  let index = 0;

  function update(){
    track.style.transform = `translateX(-${index * 100}%)`;

    const capBox = document.querySelector(".caption");
    if(capBox){
      capBox.textContent = slides[index].dataset.caption || "";
    }
  }

  if(next){
    next.addEventListener("click", ()=>{
      index = (index + 1) % slides.length;
      update();
    });
  }

  if(prev){
    prev.addEventListener("click", ()=>{
      index = (index - 1 + slides.length) % slides.length;
      update();
    });
  }

  // ✅ Touch swipe for mobile
  let startX = null;
  carousel.addEventListener("touchstart", e=>{
    startX = e.touches[0].clientX;
  });

  carousel.addEventListener("touchend", e=>{
    if(startX === null) return;
    const diff = e.changedTouches[0].clientX - startX;

    if(diff > 50){
      index = (index - 1 + slides.length) % slides.length;
    }else if(diff < -50){
      index = (index + 1) % slides.length;
    }

    update();
    startX = null;
  });

  update();
})();
