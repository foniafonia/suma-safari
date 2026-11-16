/* Manos sintéticas (21 puntos, formato MediaPipe) para las pruebas: sin cámara, sin datos de nadie. */
/* mano derecha de frente, muñeca abajo (y crece hacia abajo, como en la imagen). ext = [pulgar, índice, corazón, anular, meñique] */
function mano(ext, opc) {
  opc = opc || {}; var ox = opc.x == null ? 0.5 : opc.x, oy = opc.y == null ? 0.85 : opc.y, ang = opc.ang || 0, esc = opc.esc || 1;
  var P = []; P[0] = [0, 0];
  var mcp = { 5: [-0.08, -0.17], 9: [0, -0.2], 13: [0.07, -0.18], 17: [0.14, -0.14] };
  P[1] = [-0.1, -0.05]; P[2] = [-0.16, -0.1]; P[3] = [-0.21, -0.15];
  P[4] = ext[0] ? [-0.29, -0.2] : [-0.07, -0.19];       /* levantado: lejos de la palma; doblado: junto al índice */
  [[1, 5], [2, 9], [3, 13], [4, 17]].forEach(function (par) {
    var f = par[0], b = par[1], m = mcp[b]; P[b] = m;
    if (ext[f]) { P[b + 1] = [m[0], m[1] - 0.08]; P[b + 2] = [m[0], m[1] - 0.14]; P[b + 3] = [m[0], m[1] - 0.2]; }
    else { P[b + 1] = [m[0], m[1] - 0.07]; P[b + 2] = [m[0], m[1] - 0.02]; P[b + 3] = [m[0], m[1] + 0.03]; }
  });
  var c = Math.cos(ang), s = Math.sin(ang);
  return P.map(function (p) { var x = p[0] * esc, y = p[1] * esc; return { x: ox + x * c - y * s, y: oy + x * s + y * c, z: 0 }; });
}

module.exports = { mano: mano };
