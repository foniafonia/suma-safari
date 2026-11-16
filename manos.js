/* Safari de las Sumas · manos y cámara (MediaPipe Hand Landmarker, copia local en vendor/mediapipe).
   Todo se hace en el navegador: la imagen de la cámara no se graba, no se guarda y no sale del aparato.
   Piezas puras (se prueban en Node con manos sintéticas): dedosLevantados, pinza, contarManos, Estabilidad.
   Motor de cámara (navegador): camIniciar / camParar / camNodo. Limita los fotogramas, se pausa con la pestaña oculta y lo apaga todo al salir. */
(function (g) {
  'use strict';
  var DEDOS = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];
  var PUNTAS = [4, 8, 12, 16, 20];
  var CONEX = [[0, 1], [1, 2], [2, 3], [3, 4], [5, 6], [6, 7], [7, 8], [9, 10], [10, 11], [11, 12], [13, 14], [14, 15], [15, 16], [17, 18], [18, 19], [19, 20]];
  var PALMA = [[0, 5], [5, 9], [9, 13], [13, 17], [0, 17]];
  var COLOR = ['#ff6b6b', '#ffa94d', '#ffd43b', '#51cf66', '#4dabf7'];
  var CFG = { estableN: 14, fps: 20 };

  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  function palma(lm) { return dist(lm[0], lm[9]) || 1e-6; }
  function fingerOf(i) { return i <= 0 ? -1 : Math.min(4, Math.floor((i - 1) / 4)); }

  /* [pulgar, índice, corazón, anular, meñique] → true si está levantado. Solo usa distancias: vale con la mano girada. */
  function dedosLevantados(lm) {
    var w = lm[0], p = palma(lm), r = [], f;
    r.push(dist(lm[4], lm[5]) > 0.62 * p && dist(lm[4], lm[17]) > dist(lm[3], lm[17]) + 0.04 * p);
    for (f = 1; f < 5; f++) r.push(dist(lm[DEDOS[f][3]], w) - dist(lm[DEDOS[f][1]], w) > 0.1 * p);
    return r;
  }
  /* pinza = pulgar e índice juntos (con histéresis para que no parpadee) */
  function pinza(lm, estabaEnPinza) { var d = dist(lm[4], lm[8]) / palma(lm); return estabaEnPinza ? d < 0.45 : d < 0.28; }
  function puntoPinza(lm) { return { x: (lm[4].x + lm[8].x) / 2, y: (lm[4].y + lm[8].y) / 2 }; }
  function contarManos(res) {
    var hs = (res && res.landmarks) || [];
    var manos = hs.filter(function (lm) { return lm && lm.length >= 21; }).map(function (lm) { var d = dedosLevantados(lm); return { lm: lm, dedos: d, n: d.filter(Boolean).length, x: lm[0].x }; });
    manos.sort(function (a, b) { return a.x - b.x; });
    return { hay: manos.length > 0, manos: manos, total: manos.reduce(function (s, m) { return s + m.n; }, 0) };
  }
  function Estabilidad(n) { this.n = n; this.v = null; this.k = 0; }
  Estabilidad.prototype.mete = function (valor) { if (valor === this.v) this.k++; else { this.v = valor; this.k = 1; } return this.k >= this.n ? this.v : null; };
  Estabilidad.prototype.reset = function () { this.v = null; this.k = 0; };
  Estabilidad.prototype.fraccion = function () { return Math.min(1, this.k / this.n); };

  /* esqueleto de la mano: líneas de colores por dedo, articulaciones y un número encima de cada dedo levantado.
     El vídeo se ve en espejo (CSS); aquí se espejan las coordenadas para que los números no salgan al revés. */
  function dibuja(cv, info, W, H) {
    var ctx = cv && cv.getContext && cv.getContext('2d'); if (!ctx) return;
    if (cv.width !== W) { cv.width = W; cv.height = H; }
    ctx.clearRect(0, 0, W, H); var num = 0, X = function (p) { return (1 - p.x) * W; }, Y = function (p) { return p.y * H; };
    info.manos.forEach(function (m) {
      var lm = m.lm; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(4, W / 120);
      PALMA.forEach(function (c) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.moveTo(X(lm[c[0]]), Y(lm[c[0]])); ctx.lineTo(X(lm[c[1]]), Y(lm[c[1]])); ctx.stroke(); });
      CONEX.forEach(function (c) { ctx.strokeStyle = COLOR[fingerOf(Math.max(c[0], c[1]))]; ctx.beginPath(); ctx.moveTo(X(lm[c[0]]), Y(lm[c[0]])); ctx.lineTo(X(lm[c[1]]), Y(lm[c[1]])); ctx.stroke(); });
      lm.forEach(function (p, i) { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b2d42'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(p), Y(p), PUNTAS.indexOf(i) >= 0 ? W / 80 : W / 130, 0, 6.2832); ctx.fill(); ctx.stroke(); });
    });
    var etiquetas = [];
    info.manos.forEach(function (m) { m.dedos.forEach(function (up, f) { if (up) etiquetas.push({ x: X(m.lm[PUNTAS[f]]), y: Y(m.lm[PUNTAS[f]]), f: f }); }); });
    etiquetas.sort(function (a, b) { return a.x - b.x; });
    etiquetas.forEach(function (e) {
      num++; var r = W / 26; ctx.fillStyle = COLOR[e.f]; ctx.strokeStyle = '#2b2d42'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, Math.max(r + 2, e.y - r * 1.6), r, 0, 6.2832); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b2d42'; ctx.font = 'bold ' + Math.round(r * 1.3) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(num), e.x, Math.max(r + 2, e.y - r * 1.6) + 1);
    });
  }

  /* ---------- motor de cámara (solo navegador) ---------- */
  var CAM = { activa: false, stream: null, nodo: null, v: null, cv: null, det: null, hl: null, inyect: null, raf: 0, ult: 0, cb: null, info: null, est: null, pantalla: '' };
  function camNodo() {
    if (!CAM.nodo) {
      var n = document.createElement('div'); n.className = 'camaraBox'; n.id = 'camBox';
      n.innerHTML = '<video id="camV" playsinline muted></video><canvas id="camC"></canvas><div class="camNum" id="camNum"></div><div class="camProg"><i id="camProg"></i></div><div class="camEstado"><span class="punto"></span> Cámara encendida · no se graba nada</div>';
      CAM.nodo = n; CAM.v = n.querySelector('video'); CAM.cv = n.querySelector('canvas');
    }
    return CAM.nodo;
  }
  function cargaDetector() {
    if (CAM.det) return Promise.resolve(CAM.det);
    if (CAM.inyect) { CAM.det = CAM.inyect; return Promise.resolve(CAM.det); }
    return import('./vendor/mediapipe/vision_bundle.mjs').then(function (M) {
      return M.FilesetResolver.forVisionTasks('./vendor/mediapipe/wasm').then(function (vision) {
        var mk = function (deleg) { return M.HandLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: './vendor/mediapipe/hand_landmarker.task', delegate: deleg }, runningMode: 'VIDEO', numHands: 2, minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 }); };
        return mk('GPU').catch(function () { return mk('CPU'); });
      }).then(function (hl) { CAM.hl = hl; CAM.det = function (v, t) { return hl.detectForVideo(v, t); }; return CAM.det; });
    });
  }
  /* devuelve una promesa: true (lista) | 'file' (abierta desde un archivo) | 'sin' (no hay cámara) | 'error' (permiso o fallo) */
  function camIniciar(cb, pantalla) {
    CAM.cb = cb; CAM.pantalla = pantalla || ''; camNodo();
    if (CAM.activa) return Promise.resolve(true);
    if (!CAM.inyect && g.location && g.location.protocol === 'file:') return Promise.resolve('file');
    var md = g.navigator && g.navigator.mediaDevices; if (!md || !md.getUserMedia) return Promise.resolve('sin');
    return md.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }).then(function (st) {
      CAM.stream = st; CAM.v.srcObject = st; CAM.v.muted = true; var pl = CAM.v.play && CAM.v.play(); if (pl && pl.catch) pl.catch(function () { });
      return cargaDetector();
    }).then(function () {
      CAM.activa = true; CAM.ult = 0; CAM.est = new Estabilidad(CFG.estableN); CAM.raf = g.requestAnimationFrame(bucle); return true;
    }).catch(function () { camParar(); return 'error'; });
  }
  function bucle(ts) {
    if (!CAM.activa) return;
    CAM.raf = g.requestAnimationFrame(bucle);
    if (g.document.hidden || ts - CAM.ult < 1000 / CFG.fps) return;
    CAM.ult = ts; var v = CAM.v; if (!v || v.readyState < 2) return;
    var res; try { res = CAM.det(v, g.performance.now()); } catch (e) { return; }
    var info = contarManos(res); CAM.info = info;
    dibuja(CAM.cv, info, v.videoWidth || 640, v.videoHeight || 480);
    var nb = g.document.getElementById('camNum'); if (nb) nb.textContent = info.hay ? String(info.total) : '';
    if (CAM.cb) CAM.cb(info);
  }
  function camProgreso(f) { var p = g.document.getElementById('camProg'); if (p) p.style.width = Math.round(100 * (f || 0)) + '%'; }
  function camParar() {
    CAM.activa = false; CAM.cb = null; try { g.cancelAnimationFrame(CAM.raf); } catch (e) { }
    try { if (CAM.stream) CAM.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { }
    CAM.stream = null; if (CAM.v) { try { CAM.v.srcObject = null; } catch (e) { } }
    if (CAM.nodo && CAM.nodo.parentNode) CAM.nodo.parentNode.removeChild(CAM.nodo);
    try { if (CAM.hl && CAM.hl.close) CAM.hl.close(); } catch (e) { }
    CAM.hl = null; if (!CAM.inyect) CAM.det = null; CAM.info = null;
  }
  function camMontar(slot) { if (slot) slot.appendChild(camNodo()); }

  var API = { dist: dist, dedosLevantados: dedosLevantados, pinza: pinza, puntoPinza: puntoPinza, contarManos: contarManos, Estabilidad: Estabilidad, dibuja: dibuja, CFG: CFG, CAM: CAM,
    camIniciar: camIniciar, camParar: camParar, camMontar: camMontar, camProgreso: camProgreso, camNodo: camNodo, COLOR: COLOR };
  g.SumaManos = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
