// Port of Circadian AnimatedBackground.metal — simplex noise dot grid
(function() {
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');

  const GRID_DENSITY = 60;
  const SPEED = 0.08;
  const BG = [46, 45, 45];
  const DOT1 = [54, 52, 52];
  const DOT2 = [42, 40, 40];

  let dpr, w, h, startTime;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }

  // Simplex 2D noise (matches the Metal snoise implementation)
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;

  const perm = new Uint8Array(512);
  const p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,
    140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,
    247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,
    57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,
    74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,
    60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,
    65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,
    200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,
    52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,
    207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,
    119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,
    129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,
    218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,
    81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,
    184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,
    222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  for (let i = 0; i < 256; i++) { perm[i] = perm[i + 256] = p[i]; }

  const grad2 = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];

  function snoise(xin, yin) {
    let s = (xin + yin) * F2;
    let i = Math.floor(xin + s);
    let j = Math.floor(yin + s);
    let t = (i + j) * G2;
    let X0 = i - t, Y0 = j - t;
    let x0 = xin - X0, y0 = yin - Y0;

    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }

    let x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    let x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;

    let ii = i & 255, jj = j & 255;
    let n0 = 0, n1 = 0, n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      let g = grad2[perm[ii + perm[jj]] % 8];
      n0 = t0 * t0 * (g[0] * x0 + g[1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      let g = grad2[perm[ii + i1 + perm[jj + j1]] % 8];
      n1 = t1 * t1 * (g[0] * x1 + g[1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      let g = grad2[perm[ii + 1 + perm[jj + 1]] % 8];
      n2 = t2 * t2 * (g[0] * x2 + g[1] * y2);
    }

    return 70 * (n0 + n1 + n2);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const time = (timestamp - startTime) / 1000;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = `rgb(${BG[0]},${BG[1]},${BG[2]})`;
    ctx.fillRect(0, 0, w, h);

    const aspect = w / h;
    const cellW = w / GRID_DENSITY;
    const cellH = h / (GRID_DENSITY / aspect);
    const cols = Math.ceil(GRID_DENSITY);
    const rows = Math.ceil(GRID_DENSITY / aspect);

    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const nx = gx / GRID_DENSITY;
        const ny = gy / GRID_DENSITY;

        const noiseVal = snoise(nx * 3 + time * SPEED, ny * 3 + time * SPEED);
        const wave = Math.sin(noiseVal * 10 - time);
        const size = Math.max(0, Math.min(1, (wave + 1) / 2)) * 0.6;

        if (size < 0.02) continue;

        const colorNoise = snoise(nx * 5 - time * 0.25, ny * 5 - time * 0.25);
        const colorMix = colorNoise * 0.5 + 0.5;

        const r = Math.round(lerp(DOT1[0], DOT2[0], colorMix));
        const g = Math.round(lerp(DOT1[1], DOT2[1], colorMix));
        const b = Math.round(lerp(DOT1[2], DOT2[2], colorMix));

        const dotW = cellW * size;
        const dotH = cellH * size;
        const px = gx * cellW + (cellW - dotW) / 2;
        const py = gy * cellH + (cellH - dotH) / 2;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, dotW, dotH);
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();
