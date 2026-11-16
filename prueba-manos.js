/* node prueba-manos.js — conteo de dedos con manos sintéticas (sin cámara ni navegador).
   Construye una mano de 21 puntos (formato MediaPipe), con cada dedo levantado o doblado, y comprueba los 32 casos, con la mano girada y con 2 manos. */
var M = require('./manos.js'), fallos = 0;
function ok(n, c, x) { if (!c) fallos++; console.log((c ? 'ok     ' : 'FALLO  ') + n + (x !== undefined ? '  ' + x : '')); }

var mano = require('./sinteticas.js').mano;
var nombres = ['pulgar', 'índice', 'corazón', 'anular', 'meñique'];
var todos = true, falloCaso = '';
for (var mask = 0; mask < 32; mask++) {
  var ext = [0, 1, 2, 3, 4].map(function (i) { return !!(mask & (1 << i)); });
  var r = M.dedosLevantados(mano(ext));
  if (r.join() !== ext.join()) { todos = false; falloCaso += ' ' + ext.map(Number).join('') + '→' + r.map(Number).join(''); }
}
ok('Los 32 casos de dedos levantados/doblados (de frente) salen exactos', todos, falloCaso);
[Math.PI / 2, Math.PI, -Math.PI / 2, 0.6, -0.6].forEach(function (a) {
  var bien = true, mal = '';
  for (var m2 = 0; m2 < 32; m2++) { var e2 = [0, 1, 2, 3, 4].map(function (i) { return !!(m2 & (1 << i)); }); if (M.dedosLevantados(mano(e2, { ang: a })).join() !== e2.join()) { bien = false; mal += ' ' + m2; } }
  ok('Con la mano girada ' + Math.round(a * 180 / Math.PI) + '° siguen saliendo los 32 casos', bien, mal);
});
var bien2 = true; for (var m3 = 0; m3 < 32; m3++) { var e3 = [0, 1, 2, 3, 4].map(function (i) { return !!(m3 & (1 << i)); }); if (M.dedosLevantados(mano(e3, { esc: 0.4 })).join() !== e3.join()) bien2 = false; }
ok('Con la mano lejos de la cámara (40 % de tamaño) también', bien2);

var cinco = mano([1, 1, 1, 1, 1]), tres = mano([0, 1, 1, 1, 0], { x: 0.25 }), dos = mano([0, 1, 1, 0, 0], { x: 0.75 });
var i1 = M.contarManos({ landmarks: [cinco] }), i2 = M.contarManos({ landmarks: [dos, tres] });
ok('contarManos: una mano abierta = 5', i1.total === 5 && i1.manos.length === 1 && i1.hay);
ok('contarManos: dos manos (3 y 2) = 5 y se ordenan de izquierda a derecha de la imagen', i2.total === 5 && i2.manos.map(function (m) { return m.n; }).join() === '3,2', i2.manos.map(function (m) { return m.n; }).join());
ok('contarManos: sin manos o sin datos = 0 y hay=false', M.contarManos({ landmarks: [] }).total === 0 && !M.contarManos(null).hay && !M.contarManos({}).hay);
ok('contarManos: ignora una mano con menos de 21 puntos', M.contarManos({ landmarks: [cinco.slice(0, 10)] }).hay === false);
ok('Puño cerrado = 0 dedos', M.contarManos({ landmarks: [mano([0, 0, 0, 0, 0])] }).total === 0);

/* pinza */
function conPinza(cerrada) { var m = mano([0, 1, 0, 0, 0]); if (cerrada) { m[4] = { x: m[8].x + 0.01, y: m[8].y + 0.015, z: 0 }; } else m[4] = { x: m[8].x - 0.2, y: m[8].y + 0.1, z: 0 }; return m; }
ok('Pinza: pulgar e índice juntos = sí; separados = no', M.pinza(conPinza(true), false) === true && M.pinza(conPinza(false), false) === false);
var semi = mano([0, 1, 0, 0, 0]); semi[4] = { x: semi[8].x - 0.06, y: semi[8].y + 0.02, z: 0 };
ok('Pinza: con histéresis (ya agarrado, aguanta un poco más abierto; sin agarrar, no empieza)', M.pinza(semi, true) === true && M.pinza(semi, false) === false);
var pp = M.puntoPinza(conPinza(true)); ok('Punto de la pinza: entre el pulgar y el índice', Math.abs(pp.x - conPinza(true)[8].x) < 0.02);

/* estabilidad */
var E = new M.Estabilidad(4), sal = [3, 3, 3, 3, 3, 2, 3, 3, 3, 3].map(function (v) { return E.mete(v); });
ok('Estabilidad: solo da el valor cuando se mantiene 4 fotogramas seguidos, y un cambio lo reinicia', sal.join() === ',,,3,3,,,,,3'.replace(/,/g, ',').split(',').map(function (x) { return x === '' ? 'null' : x; }).join() || sal.map(function (x) { return x === null ? 'n' : x; }).join('') === 'nnn33nnnn3', sal.map(function (x) { return x === null ? 'n' : x; }).join(''));
E.mete(5); E.reset(); ok('Estabilidad: reset vuelve a empezar y la fracción llega a 1', E.k === 0 && (function () { var e = new M.Estabilidad(2); e.mete(1); var a = e.fraccion(); e.mete(1); return a === 0.5 && e.fraccion() === 1; })());

/* esqueleto con un lienzo falso */
var llam = { arcos: 0, lineas: 0, textos: [] };
var ctx = new Proxy({}, { get: function (t, k) { return k === 'arc' ? function () { llam.arcos++; } : k === 'lineTo' ? function () { llam.lineas++; } : k === 'fillText' ? function (tx) { llam.textos.push(tx); } : (t[k] || function () { }); }, set: function (t, k, v) { t[k] = v; return true; } });
var cv = { width: 0, height: 0, getContext: function () { return ctx; } };
M.dibuja(cv, M.contarManos({ landmarks: [dos, tres] }), 640, 480);
ok('Esqueleto: dibuja 2 manos (21 puntos cada una), líneas de los dedos y numera 1–5 los dedos levantados', cv.width === 640 && llam.arcos >= 42 && llam.lineas >= 2 * 21 && llam.textos.join('') === '12345', llam.textos.join('') + ' arcos=' + llam.arcos);
M.dibuja({ getContext: function () { return null; } }, i1, 640, 480); ok('Esqueleto: sin lienzo no falla', true);
console.log(fallos ? '\nHAY ' + fallos + ' FALLOS' : '\nTodo bien'); process.exit(fallos ? 1 : 0);
