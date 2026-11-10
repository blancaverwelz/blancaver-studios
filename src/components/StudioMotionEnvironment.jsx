import { useEffect, useRef } from "react";
import { easeRange } from "./studioMonitor";

function paintScreen(ctx, p) {
  const w = 1280,
    h = 720;
  ctx.fillStyle = "#111b20";
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(900, 340, 10, 850, 360, 650);
  glow.addColorStop(0, "#2a3b40");
  glow.addColorStop(1, "#111b20");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#b4c5c910";
  ctx.lineWidth = 1;
  for (let x = 45; x < w; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, 100);
    ctx.lineTo(x, 615);
    ctx.stroke();
  }
  for (let y = 125; y < 630; y += 70) {
    ctx.beginPath();
    ctx.moveTo(45, y);
    ctx.lineTo(1235, y);
    ctx.stroke();
  }
  ctx.font = "18px monospace";
  ctx.fillStyle = "#b3bec1";
  ctx.fillText("BLANCAVER  /  MOTION STUDIES", 55, 58);
  ctx.textAlign = "right";
  ctx.fillText("STAGE 06", 1225, 58);
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffd301";
  ctx.fillRect(55, 83, 1170 * easeRange(p, 0, 4.1), 2);
  if (p < 2) {
    const t = easeRange(p, 1.03, 1.68);
    ctx.fillStyle = "#e7e8df";
    ctx.font = "bold 78px Arial";
    ctx.fillText("MAKE YOUR", 90, 305);
    ctx.fillStyle = t > 0.2 ? "#ffd301" : "#e7e8df";
    ctx.fillText("MESSAGE CLEAR.", 90 + 55 * t, 425);
    ctx.fillStyle = "#ffd301";
    ctx.fillRect(90 + t * 55, 447, ctx.measureText("MESSAGE CLEAR.").width, 4);
    ctx.fillStyle = "#aebdc0";
    ctx.font = "23px monospace";
    ctx.fillText("A MESSAGE WITH A FOCAL POINT.", 95, 535);
    // Position keyframes form an understated editing strip.
    for (let i = 0; i < 7; i++) {
      ctx.save();
      ctx.translate(850 + i * 53, 535);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = i <= t * 6 ? "#ffd301" : "#5e6d70";
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();
    }
  } else if (p < 3) {
    ctx.fillStyle = "#f0f0e8";
    ctx.font = "bold 62px Arial";
    ctx.fillText("A CLEARER NEXT STEP.", 85, 218);
    const t = easeRange(p, 2.03, 2.7);
    ["BOOK", "INSPECT", "UNDERSTAND"].forEach((label, i) => {
      const on = easeRange(t, i * 0.24, i * 0.24 + 0.28),
        x = 85 + i * 390;
      ctx.globalAlpha = 0.25 + on * 0.75;
      ctx.fillStyle = "#26353b";
      ctx.fillRect(x, 290, 340, 195);
      ctx.fillStyle = "#ffd301";
      ctx.font = "25px monospace";
      ctx.fillText(`0${i + 1}`, x + 25, 337);
      ctx.fillStyle = "#f0f0e8";
      ctx.font = "bold 29px Arial";
      ctx.fillText(label, x + 25, 430);
      ctx.fillStyle = "#ffd301";
      ctx.fillRect(x, 483, 340 * on, 3);
      ctx.globalAlpha = 1;
    });
    ctx.font = "20px monospace";
    ctx.fillStyle = "#aebdc0";
    ctx.fillText("VEHICLE INSPECTION / EXPLAINED IN THREE MOMENTS", 85, 555);
  } else {
    const t = easeRange(p, 3.05, 3.7);
    ctx.fillStyle = "#ffd301";
    ctx.font = "20px monospace";
    ctx.fillText("NO SOUND REQUIRED", 85, 178);
    ctx.fillStyle = "#f0f0e8";
    ctx.font = "bold 96px Arial";
    ctx.fillText("YOUR NEXT", 85, 318);
    ctx.fillText("LUNCH BREAK.", 85, 425);
    ctx.globalAlpha = 0.25 + 0.75 * t;
    ctx.fillStyle = "#ffd301";
    ctx.fillRect(85, 486, 390 * t, 65);
    ctx.fillStyle = "#101719";
    ctx.font = "bold 26px Arial";
    if (t > 0.3) ctx.fillText("WEEKDAYS  /  11 AM–2 PM", 110, 529);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = "#83959855";
  ctx.beginPath();
  ctx.moveTo(55, 635);
  ctx.lineTo(1225, 635);
  ctx.stroke();
  for (let i = 0; i < 52; i++) {
    ctx.fillStyle = i / 52 < p / 4.1 ? "#ffd301" : "#72858a";
    ctx.fillRect(55 + i * 22.5, 653, 1, i % 4 === 0 ? 16 : 7);
  }
}

// A cyclic camera move and text emphasis keep the complete offer readable.
function paintNoon(ctx, sandwich, seconds, reducedMotion = false) {
  const phase = ((seconds % 14) / 14) * Math.PI * 2;
  const drift = (1 - Math.cos(phase)) / 2;
  ctx.fillStyle = "#7a160e";
  ctx.fillRect(0, 0, 1280, 720);
  const glow = ctx.createRadialGradient(950, 350, 20, 950, 350, 780);
  glow.addColorStop(0, "#b74020");
  glow.addColorStop(1, "#7a160e");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1280, 720);
  if (sandwich.complete && sandwich.naturalWidth) {
    ctx.save();
    ctx.translate(990, 450 - Math.sin(phase) * 7);
    const zoom = 1 + drift * 0.035;
    ctx.scale(zoom, zoom);
    ctx.drawImage(
      sandwich,
      -500,
      -320,
      1000,
      (1000 * sandwich.naturalHeight) / sandwich.naturalWidth,
    );
    ctx.restore();
  }
  ctx.fillStyle = "#fff4de";
  ctx.font = "bold 28px Arial";
  ctx.fillText("NOON & CO.", 76, 80);
  ctx.fillStyle = "#fff4de80";
  ctx.fillRect(300, 68, 904, 1);
  const textTime = reducedMotion ? 2 : seconds % 14;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const easeOut = (value) => 1 - Math.pow(1 - value, 3);

  [
    { text: "Lunch,", baseline: 290, delay: 0.15 },
    { text: "sorted.", baseline: 425, delay: 0.4 },
  ].forEach(({ text, baseline, delay }) => {
    const reveal = easeOut(clamp((textTime - delay) / 0.85));
    const exit = reducedMotion ? 0 : clamp((textTime - 13.1 - delay) / 0.45);

    ctx.save();

    // Each line slides through its own invisible reveal window.
    ctx.beginPath();
    ctx.rect(70, baseline - 120, 540, 135);
    ctx.clip();

    ctx.globalAlpha *= reveal * (1 - exit);
    ctx.translate(0, (1 - reveal) * 130 - exit * 24);
    ctx.fillStyle = "#fff4de";
    ctx.font = "bold 130px Arial";
    ctx.fillText(text, 76, baseline);

    ctx.restore();
  });
  ctx.fillStyle = "#fff4dea6";
  ctx.fillRect(76, 490, 490, 1);
  ctx.fillStyle = "#fff4de";
  ctx.font = "bold 25px Arial";
  ctx.fillText("CRISPY CHICKEN SANDWICH", 76, 538);
  // A restrained highlight travels through the offer, then returns seamlessly.
  const emphasis = Math.pow(Math.sin(phase / 2), 4);
  ctx.fillStyle = `rgba(255,244,222,${0.05 + emphasis * 0.13})`;
  ctx.fillRect(66, 560, 320, 51);
  ctx.fillStyle = "#fff4de";
  ctx.font = "bold 24px Arial";
  ctx.fillText("WEEKDAYS · 11 AM–2 PM", 76, 594);
}

// Project a flat canvas onto the four photographed bezel corners using CSS.
// Browser compositing avoids the seams and cost of hundreds of clipped triangles.
function screenTransform(points) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = points;
  const dx1 = x1 - x2,
    dx2 = x3 - x2,
    dy1 = y1 - y2,
    dy2 = y3 - y2;
  const dx3 = x0 - x1 + x2 - x3,
    dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / det,
    h = (dx1 * dy3 - dx3 * dy1) / det;
  return `matrix3d(${(x1 - x0 + g * x1) / 1280},${(y1 - y0 + g * y1) / 1280},0,${g / 1280},${(x3 - x0 + h * x3) / 720},${(y3 - y0 + h * y3) / 720},0,${h / 720},0,0,1,0,${x0},${y0},0,1)`;
}

export default function StudioMotionEnvironment({
  progress,
  entrance = 1,
  active,
  exitProgress = 0,
  paused = false,
}) {
  const mountRef = useRef(null),
    controls = useRef(null);
  const inputs = useRef({ progress, entrance, active, exitProgress, paused });
  useEffect(() => {
    inputs.current = { progress, entrance, active, exitProgress, paused };
    controls.current?.draw();
  }, [progress, entrance, active, exitProgress, paused]);
  useEffect(() => {
    const mount = mountRef.current,
      canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d"),
      screen = document.createElement("canvas");
    screen.width = 1280;
    screen.height = 720;
    const screenCtx = screen.getContext("2d");
    if (!ctx || !screenCtx) return;
    Object.assign(screen.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: "1280px",
      height: "720px",
      transformOrigin: "0 0",
      pointerEvents: "none",
    });
    mount.append(canvas, screen);
    const photo = new Image(),
      sandwich = new Image();
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let dead = false,
      raf = 0,
      previous = 0,
      elapsed = 0,
      lastPaint = -Infinity;
    function render(now) {
      raf = 0;
      const {
        progress: p,
        entrance: e,
        exitProgress: x,
        paused: stopped,
      } = inputs.current;
      const {
        width: w,
        height: h,
        top,
        bottom,
      } = mount.getBoundingClientRect();
      if (
        dead ||
        document.hidden ||
        !inputs.current.active ||
        !w ||
        !h ||
        bottom <= 0 ||
        top >= innerHeight
      ) {
        previous = 0;
        return;
      }
      const preview = p >= 4.32;
      const playing = preview && !stopped && !motion.matches;
      if (playing && previous) elapsed += Math.min(now - previous, 100);
      previous = playing ? now : 0;
      if (!preview) elapsed = 0;
      // Limit painting to 30 fps while leaving scroll updates responsive.
      if (playing && now - lastPaint < 32) {
        draw();
        return;
      }
      lastPaint = now;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      if (
        canvas.width !== Math.round(w * dpr) ||
        canvas.height !== Math.round(h * dpr)
      ) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#101719";
      ctx.fillRect(0, 0, w, h);
      if (!photo.complete || !photo.naturalWidth) {
        previous = 0;
        return;
      }
      const mobile = w <= 680;
      const zoom = motion.matches
        ? 1
        : 1 + easeRange(p, 0, 4.1) * 0.025 + easeRange(x, 0, 0.9) * 0.025;
      const scale =
        (mobile
          ? (w * 0.9) / 722
          : Math.max(w / photo.width, h / photo.height)) * zoom;
      const iw = photo.width * scale,
        ih = photo.height * scale;
      const left = mobile ? w * 0.5 - 1211 * scale : (w - iw) / 2;
      const y = mobile ? h * 0.02 : (h - ih) / 2;
      ctx.drawImage(photo, left, y, iw, ih);
      const corners = [
        [850, 182],
        [1572, 110],
        [1572, 541],
        [850, 530],
      ].map(([a, b]) => [left + a * scale, y + b * scale]);
      screen.style.transform = screenTransform(corners);
      const chapter = mount.closest(".motion-chapter");

      if (chapter) {
        const [screenRight, screenBottom] = corners[2];

        chapter.style.setProperty(
          "--motion-control-right",
          `${Math.max(16, w - screenRight)}px`,
        );

        chapter.style.setProperty(
          "--motion-control-top",
          `${screenBottom + 8}px`,
        );
      }
      screen.style.opacity = 0.35 + 0.65 * easeRange(e, 0.58, 1);
      paintScreen(screenCtx, p);
      if (preview) {
        screenCtx.save();
        screenCtx.globalAlpha = easeRange(p, 4.32, 4.55);
        paintNoon(screenCtx, sandwich, elapsed / 1000, motion.matches);
        screenCtx.restore();
      }
      canvas.dataset.rendered = "true";
      screen.dataset.preview = String(preview);
      screen.dataset.time = String(elapsed);
      if (playing) draw();
    }
    function draw() {
      if (!dead && !raf) raf = requestAnimationFrame(render);
    }
    photo.onload = draw;
    sandwich.onload = draw;
    photo.src = `${import.meta.env.BASE_URL}images/motion/motion-editing-suite.webp`;
    sandwich.src = `${import.meta.env.BASE_URL}images/noon-chicken-sandwich-optimized.webp`;
    const resize = new ResizeObserver(draw),
      visible = new IntersectionObserver(draw);
    resize.observe(mount);
    visible.observe(mount);
    const visibility = () => {
      previous = 0;
      draw();
    };
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", draw);
    controls.current = { draw };
    draw();
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      photo.onload = null;
      sandwich.onload = null;
      resize.disconnect();
      visible.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", draw);
      controls.current = null;
      canvas.remove();
      screen.remove();
    };
  }, []);
  return <div ref={mountRef} />;
}
