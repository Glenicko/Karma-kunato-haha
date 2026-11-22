// =========================================================
// 1. DEFAULT NOTE DATA & URL PARAMETER PARSING
// =========================================================
const DEFAULT_NOTE = {
  to: "To Adi",
  msg: " Hii adi. \n\nUhm first of all sorry, Sorry for everything I've done specially nung gabing yon, diko manlang inintindi yung side mo nag base agad ako sa kung anung sitwasyon natin and badly that's the decision I've made. Sorry for giving up on u jst because on my nonsense immaturity personality, sorry i said those words that i didn't mean on that night, siguro nga nalunod narin ako sa sarili kung pag iisip in that time, you know what I'm so disappointed to my self for doing that decision kase kala ko kaya kung gampanan lagi ang mga sasabihin ko eh. Also Sorry for being selfish to the point na I want all of your attention that if i didn't have eh I'll make my own way to think or overthink nang kung ano ano na ako lang din naman ang may alam. \n\nSo sorry for everything I've done, I can't even  blame you if u can't forgive me rin ih. For all of your sacrifices and hardwork I am proud of you kase ang dami munang na accomplished and ma a-accomplish pa. I wish i can just  literally said it all to you like kahit i congratulate manlang kita sa chat or what pero wala e I'm too bullshit para gawin yan, all i can do is to support you from a far o kahit sa patago manlang or bulong manalng sa hangin. Well i guess my pross din nung nawala ako cuz I know na mas nag focus ka sa ginagawa mo. \n\nSa bawat panalo mo proud na proud ako sayo kasi nung unang araw mupalang sa practice mo puro complain ka pa, but look at now, u are now adapting everything and much of it improving. Pero alam mo may bigat din sakin, kase ako dapat yung num.1 na sumosuporta sayo eh but look at us, look what i did, I ruined everything I ruined us. Everytime na makikita kita nahihiya ako nilalayo kunalang tingen ko sayo much of it hindi nako na tingen sa mga taong nakakasalamuha ko cuz ik what i did. Well I'm also glad that sayo yung first time na mag reach out ako sa isang tao. I'm also glad na sayokurin na experience yung both pain nang pag buo ng relationship. \n\nSorry to say this but yes I'm selfish when it comes to us, I miss you every single time lagi kitang iniisip and I'm always asking my self na kamusta kana ba? Kung ano nabang nang yayari sa buhay mo? Kung okay kapa ba? But all of it di rin nawawala sa isipan ko na it was all of my fault baka nga naka dag-dag pako sa trauma mo eh, pero don't worry dinako makikiusap o mag be-beg pa for another chance alam kunaman na hindi ko deserve yan after all what i did to you. Sobrang special kunaman kung bibigyan mupako diba?",
  from: "Again sorry for reaching out and ruining your peace."
};

function getNoteFromURL() {
  const params = new URLSearchParams(window.location.search);
  return {
    to: params.get("to") || DEFAULT_NOTE.to,
    msg: params.get("msg") || DEFAULT_NOTE.msg,
    from: params.get("from") || DEFAULT_NOTE.from
  };
}

const currentNote = getNoteFromURL();

// =========================================================
// 2. NATURAL-SIZED 3D ASCII BOUQUET ENGINE
// =========================================================
const asciiCanvas = document.getElementById("ascii-canvas");
const WIDTH = 88;
const HEIGHT = 44;

// Much slower gentle drift & natural camera framing
const SLOW_SPIN_SPEED = 0.0022;
const BUILD_DURATION = 2.6;
const TILT = 0.28;
const CAM_DIST = 4.35;
const PIVOT_Y = 0.14;

// Normalized light direction: (-0.45, 0.6, 0.66)
const _L = [-0.45, 0.6, 0.66];
const _n = Math.hypot(_L[0], _L[1], _L[2]) || 1;
const LX = _L[0] / _n;
const LY = _L[1] / _n;
const LZ = _L[2] / _n;

const SHADE = ".:-=+*%@";
const PETAL_SHADE = "+*#%@";

const PALETTES = {
  violetDeep: ["#ca25eb", "#d07cf1", "#d850e2", "#d888ee", "#bb4af8", "#c388f4"],
  magentaBright: ["#ea72f0", "#c87bf2", "#c266e0", "#d760e7", "#d946ef", "#e879f9"],
  indigoAccent: ["#c458f1", "#e1e1e1", "#a83edd", "#be6bed", "#b96cda", "#d331dc"],
  creamCenter: ["#fef08a", "#fef9c3", "#fffbeb", "#ffffff"],
  greens: ["#064e3b", "#065f46", "#047857", "#15803d", "#16a34a", "#22c55e", "#4ade80"],
  hotPinkBow: ["#831843", "#9d174d", "#be185d", "#db2777", "#ec4899", "#f472b6"]
};

const FLASH_COLORS = ["#ffffff", "#f37ef1", "#d029e9", "#80329c", "#ffffff"];

function norm(v) {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function add(p, d, k) {
  return [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];
}

function shadeColor(palette, b) {
  const clamped = Math.min(0.999, Math.max(0, b));
  const idx = Math.min(palette.length - 1, Math.floor(clamped * palette.length));
  return palette[idx];
}

function shadeChar(ramp, b) {
  const clamped = Math.min(0.999, Math.max(0, b));
  const idx = Math.min(ramp.length - 1, Math.floor(clamped * ramp.length));
  return ramp[idx];
}

function createRng(seed = 21) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildScene() {
  const rnd = createRng(21);
  const pts = [];
  const blooms = [];

  const neck = [0.0, -0.16, 0.0];
  const domeCenter = [0.0, 0.14, 0.0];
  const domeRadius = 0.62;

  const numHeads = 15;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const headPalettes = [
    PALETTES.violetDeep,
    PALETTES.magentaBright,
    PALETTES.violetDeep,
    PALETTES.magentaBright,
    PALETTES.indigoAccent
  ];

  for (let i = 0; i < numHeads; i++) {
    const el = ((83 - 64 * Math.sqrt(i / (numHeads - 1))) * Math.PI) / 180;
    const az = i * golden;
    const d = norm([
      Math.cos(el) * Math.cos(az),
      Math.sin(el),
      Math.cos(el) * Math.sin(az)
    ]);
    const dist = domeRadius * (0.9 + rnd() * 0.14);
    const pos = add(domeCenter, d, dist);

    const base = add(pos, d, -0.03);
    for (let j = 0; j < 40; j++) {
      const t = j / 39;
      const p = [
        base[0] + (neck[0] - base[0]) * t,
        base[1] + (neck[1] - base[1]) * t,
        base[2] + (neck[2] - base[2]) * t
      ];
      pts.push({
        x: p[0], y: p[1], z: p[2],
        nx: d[0], ny: 0.1, nz: d[2],
        pal: PALETTES.greens,
        tone: -0.14,
        twoSided: true,
        override: null,
        buildOrder: 0.15 + t * 0.45
      });
    }

    const pal = headPalettes[i % headPalettes.length];
    const hasCenter = i % 3 !== 2;
    blooms.push({
      pos,
      pal,
      centerPal: hasCenter ? PALETTES.creamCenter : null,
      nPet: 6 + (i % 4),
      r: 0.13 + rnd() * 0.025,
      seed: rnd() * Math.PI * 2,
      buildOrder: 0.55 + (i / numHeads) * 0.4
    });
  }

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.25;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const base = [0.24 * c, 0.16 + (i % 3) * 0.05, 0.24 * s];
    const d = norm([c, 0.22, s]);
    const side = [-s, 0.0, c];
    const n = norm(cross(side, d));
    const len = 0.28;
    const wid = 0.07;

    for (let ti = 0; ti < 22; ti++) {
      const t = ti / 21;
      for (let wi = -4; wi <= 4; wi++) {
        const w = wi / 4;
        const curl = 0.02 * w * w;
        const p = [
          base[0] + d[0] * len * t + side[0] * wid * Math.sin(Math.PI * t) * w + n[0] * curl,
          base[1] + d[1] * len * t - 0.07 * t * t + n[1] * curl,
          base[2] + d[2] * len * t + side[2] * wid * Math.sin(Math.PI * t) * w + n[2] * curl
        ];
        pts.push({
          x: p[0], y: p[1], z: p[2],
          nx: n[0], ny: n[1], nz: n[2],
          pal: PALETTES.greens,
          tone: wi === 0 ? -0.2 : 0.04,
          twoSided: true,
          override: null,
          buildOrder: 0.4 + t * 0.35
        });
      }
    }
  }

  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const sx = 0.035 * Math.cos(a);
    const sz = 0.035 * Math.sin(a);
    for (let j = 0; j < 26; j++) {
      const t = j / 25;
      pts.push({
        x: sx * (1 + 0.5 * t),
        y: -0.16 - 0.3 * t,
        z: sz * (1 + 0.5 * t),
        nx: Math.cos(a),
        ny: 0.0,
        nz: Math.sin(a),
        pal: PALETTES.greens,
        tone: -0.08,
        twoSided: true,
        override: null,
        buildOrder: t * 0.22
      });
    }
  }

  const by = -0.14;
  const br = 0.095;
  for (let j = 0; j < 64; j++) {
    const ph = (j / 64) * Math.PI * 2;
    for (const dy of [-0.012, 0, 0.012]) {
      pts.push({
        x: br * Math.cos(ph),
        y: by + dy,
        z: br * Math.sin(ph),
        nx: Math.cos(ph),
        ny: 0.0,
        nz: Math.sin(ph),
        pal: PALETTES.hotPinkBow,
        tone: 0.05,
        twoSided: false,
        override: null,
        buildOrder: 0.22 + (j / 64) * 0.14
      });
    }
  }

  const knot = [0.0, by, br + 0.012];
  for (const side of [-1, 1]) {
    for (let j = 0; j < 50; j++) {
      const a = (j / 50) * Math.PI * 2;
      const lx = side * (0.075 + 0.07 * Math.cos(a));
      const ly = 0.045 * Math.sin(a) + 0.02 * (0.075 + 0.07 * Math.cos(a)) / 0.145;
      for (const fill of [1.0, 0.72]) {
        pts.push({
          x: knot[0] + lx * fill,
          y: knot[1] + ly * fill,
          z: knot[2] + 0.012,
          nx: side * 0.25,
          ny: 0.2,
          nz: 0.94,
          pal: PALETTES.hotPinkBow,
          tone: 0.12,
          twoSided: true,
          override: null,
          buildOrder: 0.28 + (j / 50) * 0.12
        });
      }
    }
    for (let j = 0; j < 24; j++) {
      const t = j / 23;
      for (const w of [-0.018, 0, 0.018]) {
        pts.push({
          x: knot[0] + side * (0.025 + 0.11 * t) + w,
          y: knot[1] - 0.18 * t,
          z: knot[2] + 0.018,
          nx: side * 0.2,
          ny: 0.0,
          nz: 0.98,
          pal: PALETTES.hotPinkBow,
          tone: -0.05 + 0.06 * Math.sin(t * 8),
          twoSided: true,
          override: null,
          buildOrder: 0.3 + t * 0.12
        });
      }
    }
  }

  for (const dx of [-0.012, 0, 0.012]) {
    for (const dy of [-0.012, 0, 0.012]) {
      pts.push({
        x: dx,
        y: by + dy,
        z: knot[2] + 0.025,
        nx: 0, ny: 0, nz: 1,
        pal: PALETTES.hotPinkBow,
        tone: 0.2,
        twoSided: true,
        override: "@",
        buildOrder: 0.35
      });
    }
  }

  const lights = [];
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2 * 2 + rnd() * 0.25;
    const y = -0.15 + (i / 33) * 0.95 + (rnd() - 0.5) * 0.08;
    const profileRadius = 0.22 + 0.56 * Math.pow(Math.max(0, Math.min(1, (y + 0.15) / 0.95)), 0.72);
    const rr = profileRadius + rnd() * 0.12;
    lights.push({
      x: rr * Math.cos(a),
      y,
      z: rr * Math.sin(a),
      phase: rnd() * Math.PI * 2,
      freq: 2.2 + rnd() * 3.4,
      color: FLASH_COLORS[i % FLASH_COLORS.length],
      buildOrder: 0.65 + (i / 34) * 0.35
    });
  }

  return { pts, blooms, lights };
}

const scene = buildScene();

// =========================================================
// 3. SLOW SPIN + SWIPE UP/DOWN & LEFT/RIGHT Z-BUFFER LOOP
// =========================================================
let angleY = 0;
let pitchX = TILT;
let isDragging = false;
let lastPointerX = 0;
let lastPointerY = 0;
let stageOpenedAt = null;

const MIN_PITCH = -0.85;
const MAX_PITCH = 0.95;
const bouquetWrapper = document.getElementById("bouquet-wrapper");

bouquetWrapper.addEventListener("pointerdown", (e) => {
  isDragging = true;
  lastPointerX = e.clientX;
  lastPointerY = e.clientY;
  if (bouquetWrapper.setPointerCapture) {
    try {
      bouquetWrapper.setPointerCapture(e.pointerId);
    } catch {}
  }
});

bouquetWrapper.addEventListener("pointermove", (e) => {
  if (!isDragging) return;
  const dx = e.clientX - lastPointerX;
  const dy = e.clientY - lastPointerY;
  lastPointerX = e.clientX;
  lastPointerY = e.clientY;

  angleY += dx * 0.011;
  pitchX = Math.min(MAX_PITCH, Math.max(MIN_PITCH, pitchX + dy * 0.009));
});

function stopDragging(e) {
  if (!isDragging) return;
  isDragging = false;
  if (e && bouquetWrapper.hasPointerCapture && bouquetWrapper.hasPointerCapture(e.pointerId)) {
    try {
      bouquetWrapper.releasePointerCapture(e.pointerId);
    } catch {}
  }
}

bouquetWrapper.addEventListener("pointerup", stopDragging);
bouquetWrapper.addEventListener("pointercancel", stopDragging);

function renderFrame(now) {
  const t = now * 0.001;
  if (!isDragging) {
    angleY += SLOW_SPIN_SPEED;
  }

  let buildProgress = 1;
  if (stageOpenedAt !== null) {
    buildProgress = Math.min(1, Math.max(0, (now - stageOpenedAt) / (BUILD_DURATION * 1000)));
  }

  const charGrid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(" "));
  const colorGrid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(null));
  const flashGrid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(false));
  const zBuffer = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(-1e9));

  const scale = Math.max(1.0, Math.min((HEIGHT - 2) / 1.65, (WIDTH - 2) / 2.9));
  const sxScale = scale * 2.0;
  const cx = WIDTH / 2;
  const cy = HEIGHT * 0.5;

  const ca = Math.cos(angleY);
  const sa = Math.sin(angleY);
  const ct = Math.cos(pitchX);
  const st = Math.sin(pitchX);

  function project(x, y, z) {
    const xr = x * ca - z * sa;
    const zr = x * sa + z * ca;
    const yp = y - PIVOT_Y;
    const yt = yp * ct - zr * st;
    const zt = yp * st + zr * ct;
    const f = CAM_DIST / (CAM_DIST - zt);
    return {
      col: Math.round(cx + xr * f * sxScale),
      row: Math.round(cy - yt * f * scale),
      zt,
      f
    };
  }

  function plot(col, row, z, ch, color, isFlash = false) {
    if (row >= 0 && row < HEIGHT && col >= 0 && col < WIDTH && z > zBuffer[row][col]) {
      zBuffer[row][col] = z;
      charGrid[row][col] = ch;
      colorGrid[row][col] = color;
      flashGrid[row][col] = isFlash;
    }
  }

  for (let i = 0; i < scene.pts.length; i++) {
    const p = scene.pts[i];
    if (p.buildOrder > buildProgress) continue;

    const { col, row, zt } = project(p.x, p.y, p.z);

    const nxr = p.nx * ca - p.nz * sa;
    const nzr = p.nx * sa + p.nz * ca;
    const nyt = p.ny * ct - nzr * st;
    const nzt = p.ny * st + nzr * ct;

    let dot = nxr * LX + nyt * LY + nzt * LZ;
    if (p.twoSided && dot < 0) dot = -dot * 0.55;
    const b = 0.25 + 0.75 * Math.max(0, dot) + p.tone;

    const ch = p.override || shadeChar(SHADE, b);
    plot(col, row, zt, ch, shadeColor(p.pal, b), false);
  }

  for (let i = 0; i < scene.blooms.length; i++) {
    const fl = scene.blooms[i];
    if (fl.buildOrder > buildProgress) continue;

    const localGrowth = Math.min(1, Math.max(0.15, (buildProgress - fl.buildOrder + 0.12) / 0.16));
    const { col: fx, row: fy, zt, f } = project(fl.pos[0], fl.pos[1], fl.pos[2]);
    const rx = fl.r * f * sxScale * localGrowth;
    const ry = fl.r * f * scale * localGrowth;
    const dim = -0.35 * (1 - Math.min(1, Math.max(0, (zt + 0.7) / 1.4)));
    const rot = fl.seed + angleY * 0.7;

    const rMin = Math.floor(fy - ry) - 1;
    const rMax = Math.ceil(fy + ry) + 1;
    const cMin = Math.floor(fx - rx) - 1;
    const cMax = Math.ceil(fx + rx) + 1;

    for (let row = rMin; row <= rMax; row++) {
      const dy = (row + 0.5 - fy) / Math.max(0.5, ry);
      for (let col = cMin; col <= cMax; col++) {
        const dx = (col + 0.5 - fx) / Math.max(0.5, rx);
        const dist = Math.hypot(dx, dy);
        if (dist > 1.05) continue;

        if (fl.centerPal && dist < 0.26) {
          const b = 0.65 - 0.3 * dx - 0.3 * dy + dim;
          plot(col, row, zt + 0.06, dist < 0.14 ? "@" : "o", shadeColor(fl.centerPal, b), false);
          continue;
        }

        const ph = Math.atan2(dy, dx);
        const reach = 0.36 + 0.64 * Math.pow(Math.abs(Math.cos((fl.nPet * (ph + rot)) / 2)), 0.72);
        if (dist > reach) continue;

        const edge = dist > reach - 0.14 ? -0.2 : 0.0;
        const b = 0.62 - 0.22 * dx - 0.26 * dy + 0.12 * dist + edge + dim;
        plot(
          col,
          row,
          zt + 0.04 * (1 - dist),
          shadeChar(PETAL_SHADE, b),
          shadeColor(fl.pal, b),
          false
        );
      }
    }
  }

  for (let i = 0; i < scene.lights.length; i++) {
    const lt = scene.lights[i];
    if (lt.buildOrder > buildProgress) continue;

    const { col, row, zt } = project(lt.x, lt.y, lt.z);
    const wave = Math.sin(t * lt.freq + lt.phase);
    if (wave > 0.65) {
      plot(col, row, zt + 0.08, "*", lt.color, true);
    } else if (wave > 0.1) {
      plot(col, row, zt + 0.06, "+", lt.color, true);
    } else if (wave > -0.45) {
      plot(col, row, zt + 0.04, "·", lt.color, false);
    }
  }

  let html = "";
  for (let y = 0; y < HEIGHT; y++) {
    let activeKey = null;
    for (let x = 0; x < WIDTH; x++) {
      const ch = charGrid[y][x];
      const col = colorGrid[y][x];
      const isFlash = flashGrid[y][x];
      const key = col !== null ? `${col}|${isFlash ? 1 : 0}` : null;
      const safeChar =
        ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch === "&" ? "&amp;" : ch;

      if (key !== activeKey) {
        if (activeKey !== null) html += "</span>";
        if (key !== null) {
          const cls = isFlash ? ` class="flash-bulb"` : "";
          html += `<span${cls} style="color:${col}">`;
        }
        activeKey = key;
      }
      html += safeChar;
    }
    if (activeKey !== null) html += "</span>";
    html += "\n";
  }

  asciiCanvas.innerHTML = html;
  requestAnimationFrame(renderFrame);
}

requestAnimationFrame(renderFrame);

// =========================================================
// 4. UI INTERACTIONS: UNWRAP & INSTANT MESSAGE MODAL
// =========================================================
const unwrapScreen = document.getElementById("unwrap-screen");
const mainStage = document.getElementById("main-stage");

unwrapScreen.addEventListener("click", () => {
  unwrapScreen.classList.remove("active");
  mainStage.classList.add("active");
  stageOpenedAt = performance.now();
});

const openMessageBtn = document.getElementById("open-message-btn");
const closeMessageBtn = document.getElementById("close-message-btn");
const closeMessageBackdrop = document.getElementById("close-message-backdrop");
const messageModal = document.getElementById("message-modal");
const letterCard = document.querySelector(".letter-card");
const unreadBadge = document.getElementById("unread-badge");

const greetingEl = document.getElementById("letter-greeting");
const bodyEl = document.getElementById("letter-body");
const signoffEl = document.getElementById("letter-signoff");

greetingEl.textContent = currentNote.to;
bodyEl.textContent = currentNote.msg;
signoffEl.textContent = currentNote.from;

function openLetterModal() {
  unreadBadge.classList.add("hidden");
  messageModal.classList.remove("hidden");
  letterCard.scrollTop = 0;
}

function closeLetterModal() {
  messageModal.classList.add("hidden");
}

openMessageBtn.addEventListener("click", openLetterModal);
closeMessageBtn.addEventListener("click", closeLetterModal);
closeMessageBackdrop.addEventListener("click", closeLetterModal);