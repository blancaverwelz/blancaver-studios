import * as THREE from 'three';

const LABELS = ['RING ALIGNMENT', 'CONTAINMENT', 'THERMAL BALANCE', 'HOUSING LOCK', 'SYSTEM READY'];

// Canvas-drawn monitor content. `section` selects the cross-section view instead of the plan view.
export function createDiagnostics(section = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 384;
  const g = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  let previous = -1;

  const line = (x1, y1, x2, y2) => {
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
  };

  function update(progress) {
    const step = Math.floor(progress * 30);
    if (step === previous) return;
    previous = step;
    g.fillStyle = '#071115';
    g.fillRect(0, 0, 768, 384);
    g.strokeStyle = '#20333c';
    g.lineWidth = 1;
    for (let x = 24; x < 768; x += 32) line(x, 60, x, 350);
    for (let y = 60; y < 384; y += 32) line(24, y, 744, y);
    g.fillStyle = '#9caeb5';
    g.font = '16px monospace';
    g.fillText('BLANCAVER / POWER CORE', 28, 32);
    g.fillStyle = '#ffd301';
    g.fillText(progress < 1 ? `ASSEMBLY / ${Math.round(progress * 100)}%` : 'CORE STABLE', 490, 32);
    g.strokeStyle = '#b6cbd3';
    g.lineWidth = 2;
    if (section) {
      for (let i = 0; i < 6; i++) g.strokeRect(155, 95 + i * 29, 175, 13);
      g.strokeRect(205, 80, 75, 205);
      g.fillStyle = '#ffd301';
      g.font = '12px monospace';
      g.fillText('SECTION / A–A', 175, 325);
    } else {
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.ellipse(242, 190, 110 - i * 23, 110 - i * 23, 0, 0, Math.PI * 2);
        g.stroke();
      }
    }
    g.strokeStyle = '#ffd301';
    line(132, 120, 132, 264);
    line(352, 120, 352, 264);
    g.font = '12px monospace';
    LABELS.forEach((label, i) => {
      g.fillStyle = '#7f939c';
      g.fillText(label, 430, 105 + i * 42);
      g.fillStyle = '#26343a';
      g.fillRect(430, 116 + i * 42, 260, 3);
      g.fillStyle = '#ffd301';
      g.fillRect(430, 116 + i * 42, 260 * THREE.MathUtils.clamp(progress * 1.5 - i * 0.12, 0, 1), 3);
    });
    texture.needsUpdate = true;
  }

  return { texture, update };
}
