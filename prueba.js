/* node -r /Users/joseaserraf/Developer/TRASPASO-FONIA/v13/jsdom-ruta.cjs prueba.js
   Prueba la lógica (niveles, rondas, puntos, podio) y la pantalla (jsdom, sin red ni navegador): campeonato, misión, ayuda, pistas, aprende. */
var path = require('path'), fallos = 0;
function ok(n, c, x) { if (!c) fallos++; console.log((c ? 'ok     ' : 'FALLO  ') + n + (x !== undefined ? '  ' + x : '')); }
var JD = require('/Users/joseaserraf/Developer/ACADEMIA-MEMBRESIA-LOGOPED-IA-visual/node_modules/jsdom'), JSDOM = JD.JSDOM, VC = JD.VirtualConsole;

function abre() {
  var errs = [], vc = new VC(); vc.on('jsdomError', function (e) { errs.push(String(e.message).slice(0, 200)); });
  return JSDOM.fromFile(path.join(__dirname, 'index.html'), { url: 'http://localhost/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse: function (w) { w.matchMedia = function () { return { matches: false, addListener: function () { }, addEventListener: function () { } }; }; w.HTMLElement.prototype.scrollIntoView = function () { }; w.scrollTo = function () { }; w.print = function () { w.__print = (w.__print || 0) + 1; }; }
  }).then(function (dom) { return { w: dom.window, d: dom.window.document, errs: errs }; });
}
var esp = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
function clic(P, sel) { var e = P.d.querySelector(sel); if (!e) throw new Error('no hay ' + sel); e.click(); }
function txt(P, sel) { var e = P.d.querySelector(sel); return e ? e.textContent.trim() : ''; }

abre().then(function (P) {
  var L = P.w.SumaSafari, w = P.w, d = P.d;
  /* ---------- lógica ---------- */
  var rngs = (function () { var s = 7; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  var bien = true, N = 300, i, p;
  for (i = 0; i < N; i++) { var niv = 1 + (i % 3); p = L.genProblema(niv, null, rngs); if (p.a < 1 || p.b < 1 || p.a + p.b !== p.sum || p.sum < L.NIVELES[niv].min || p.sum > L.NIVELES[niv].max) bien = false; }
  ok('genProblema: 300 problemas, sumandos ≥ 1 y suma dentro del nivel (hasta 5, 7 y 10)', bien);
  var us = {}, ds = {}; for (i = 0; i < 6; i++) { p = L.genProblema(1, us, rngs); ds[p.a + '+' + p.b] = 1; }
  ok('genProblema: no repite hasta agotar las sumas del nivel 1 (hay 10 combinaciones)', Object.keys(ds).length === 6);
  var ron = L.genRonda(2, 4, 0, rngs);
  ok('genRonda: los 4 equipos tienen la MISMA suma, y repartida de formas distintas', ron.every(function (x) { return x.sum === ron[0].sum && x.a + x.b === x.sum; }) && new Set(ron.map(function (x) { return x.a; })).size === Math.min(4, ron[0].sum - 1), JSON.stringify(ron.map(function (x) { return x.a + '+' + x.b; })));
  var evita = true; for (i = 0; i < 40; i++) { if (L.genRonda(3, 2, 8, rngs)[0].sum === 8) evita = false; } ok('genRonda: no repite la suma de la ronda anterior', evita);
  ok('puntos: sin pista 3, con 1 o 2 pistas 2, con 3 o más 1', L.puntos(0) === 3 && L.puntos(1) === 2 && L.puntos(2) === 2 && L.puntos(3) === 1 && L.puntos(5) === 1);
  ok('nivelRonda (5 rondas): 1,1,2,2,3 — y nunca pasa de 3', [0, 1, 2, 3, 4].map(function (r) { return L.nivelRonda(r, 5); }).join() === '1,1,2,2,3' && L.nivelRonda(7, 8) === 3);
  ok('nivelParada: 4 paradas por nivel', [0, 3, 4, 7, 8, 11].map(L.nivelParada).join() === '1,1,2,2,3,3');
  var rk = L.ranking([{ pts: 10, aciertos: 5 }, { pts: 12, aciertos: 4 }, { pts: 10, aciertos: 5 }, { pts: 3, aciertos: 1 }]).map(function (x) { return x.puesto; });
  ok('ranking: empates comparten puesto (1,2,2,4)', rk.join() === '1,2,2,4', rk.join());
  ok('estrellasMision: 3 estrellas con ≥ 75 %, 2 con ≥ 50 %, 1 en otro caso', L.estrellasMision(9, 12) === 3 && L.estrellasMision(6, 12) === 2 && L.estrellasMision(1, 12) === 1);

  /* ---------- pantallas ---------- */
  ok('Inicio: título y 4 tarjetas', /Safari de las Sumas/.test(txt(P, 'h1')) && d.querySelectorAll('.menu .card').length === 4);

  /* Aprendemos juntos */
  clic(P, '[data-p=aprende]');
  ok('Aprende: 5 representaciones (contar, dedos, marco, recta, palitos)', d.querySelectorAll('.repcard').length === 5 && ['contar', 'dedos', 'marco', 'recta', 'palitos'].every(function (k) { return d.querySelector('.rep[data-rep=' + k + ']'); }));
  ok('Aprende 3+2: marco de 10 con 3 casillas rojas y 2 azules; faltan 5', d.querySelectorAll('.marco i.g1').length === 3 && d.querySelectorAll('.marco i.g2').length === 2 && /faltan 5/.test(txt(P, '.falta')));
  ok('Aprende 3+2: dedos = el mayor (3) en la cabeza y 2 dedos levantados con 4 y 5', txt(P, '.bub b') === '3' && d.querySelectorAll('.mano .f.st').length === 2 && d.querySelector('.mano .f.st:last-of-type b, .mano .f.st:nth-child(2) b').textContent === '5');
  ok('Aprende 3+2: palitos 3 + 2 y total 5', d.querySelectorAll('.monton.g1 .pal').length === 3 && d.querySelectorAll('.monton.g2 .pal').length === 2 && /5/.test(txt(P, '.atado')));
  ok('Aprende 3+2: recta con 2 saltos (+1), 11 casillas (0–10) y la rana en el 5 (mitad de la recta)', d.querySelectorAll('.arco').length === 2 && d.querySelectorAll('.tick').length === 11 && Math.abs(parseFloat(d.querySelector('.rana').style.left) - 50) < 0.01, d.querySelector('.rana').style.left);
  clic(P, '[data-act=da][data-w=a][data-d="1"]'); clic(P, '[data-act=da][data-w=a][data-d="1"]');
  ok('Aprende: con «+» al primer número pasa a 5 + 2 = 7', txt(P, '.num .a') === '5' && txt(P, '.res') === '7');
  for (i = 0; i < 8; i++) clic(P, '[data-act=da][data-w=b][data-d="1"]');
  ok('Aprende: nunca pasa de 10 (5 + 5 = 10)', +txt(P, '.num .a') + +txt(P, '.num .b') === 10 && txt(P, '.res') === '10');
  for (i = 0; i < 12; i++) clic(P, '[data-act=da][data-w=a][data-d="-1"]');
  ok('Aprende: nunca baja de 1', txt(P, '.num .a') === '1');
  clic(P, '[data-act=azar]'); var s2 = +txt(P, '.num .a') + +txt(P, '.num .b'); ok('Aprende: «otra suma» da una suma de 2 a 10', s2 >= 2 && s2 <= 10 && +txt(P, '.res') === s2);
  /* reproducir paso a paso: al empezar se apagan los pasos y luego se encienden de uno en uno */
  w.SumaSafari.estado.cfg.sonido = false; w.SumaSafari.estado.cfg.voz = false;
  clic(P, '.repcard:nth-child(3) [data-act=playRep]');
  ok('Reproducir (marco): al empezar el primer paso se enciende y el resto se apaga', d.querySelectorAll('.repcard:nth-child(3) .st.on').length === 1 && d.querySelectorAll('.repcard:nth-child(3) .st').length > 1);
  return esp(1700).then(function () {
    var n = d.querySelectorAll('.repcard:nth-child(3) .st.on').length; ok('Reproducir (marco): a los ~1,7 s van 3 pasos (uno cada 0,7 s)', n === 3, n);
    clic(P, '[data-p=inicio]'); /* sale: temporizadores limpios */ return esp(50);
  }).then(function () {
    /* ---------- Campeonato ---------- */
    clic(P, '[data-p=cfgcamp]'); clic(P, '[data-k=equipos][data-v="3"]'); clic(P, '[data-k=rondas][data-v="3"]'); clic(P, '[data-k=nivel][data-v="1"]');
    ok('Ajustes: 3 equipos, 3 rondas y nivel 1 quedan marcados', d.querySelectorAll('.chip.sel').length >= 3 && w.SumaSafari.estado.cfg.equipos === 3 && w.SumaSafari.estado.cfg.rondas === 3 && w.SumaSafari.estado.cfg.nivel === '1');
    w.SumaSafari.estado.cfg.sonido = false; w.SumaSafari.estado.cfg.voz = false;
    clic(P, '[data-act=empezarCamp]');
    var g = w.SumaSafari.estado.g;
    ok('Campeonato: 3 equipos en el marcador, turno del primero, 10 teclas (1–10)', d.querySelectorAll('.marcador .eq').length === 3 && d.querySelector('.eq.act') && /Leones/.test(txt(P, '.turno')) && d.querySelectorAll('#teclado button').length === 10);
    ok('Campeonato: en el nivel 1 (apoyo «se va quitando») salen los dibujos y la suma con ❓', d.querySelectorAll('.pregunta .it').length === g.p.a + g.p.b && txt(P, '#int') === '❓');
    /* equipo 1: acierta a la primera sin pistas → 3 ⭐ */
    clic(P, '#teclado button[data-n="' + g.p.sum + '"]');
    ok('Acierto a la primera: sale el cartel de «Muy bien», +3 ⭐ para Leones', d.querySelector('#capa.on') && /Leones/.test(txt(P, '#capa h2')) && g.equipos[0].pts === 3 && g.equipos[0].racha === 1);
    clic(P, '[data-act=sig]');
    ok('Siguiente: turno de los Elefantes y misma suma que su compañero (equidad)', /Elefantes/.test(txt(P, '.turno')) && g.p.sum === g.cola[0].sum);
    /* equipo 2: se equivoca, luego acierta → pista automática y menos puntos */
    var mal = g.p.sum === 5 ? 4 : g.p.sum + 1; clic(P, '#teclado button[data-n="' + mal + '"]');
    ok('Fallo: mensaje amable, tecla gris (no se puede repetir) y sin quitar puntos', /Casi/.test(txt(P, '#msg')) && d.querySelector('#teclado button[data-n="' + mal + '"]').classList.contains('mal') && g.equipos[1].pts === 0);
    return esp(1000).then(function () {
      ok('Fallo: a los 0,9 s se abre sola una pista (contar todo) y queda contada', g.abiertas.length === 1 && g.abiertas[0] === 'contar' && d.querySelector('#panelPista .rep[data-rep=contar]'));
      clic(P, '[data-act=pista]'); ok('Botón «Pista»: abre la siguiente (dedos)', g.abiertas.join() === 'contar,dedos' && d.querySelector('#panelPista .rep[data-rep=dedos]'));
      clic(P, '[data-act=verPista][data-k=contar]'); ok('Volver a ver una pista ya abierta no cuesta otra', g.pistas === 2 && g.verPista === 'contar');
      clic(P, '#teclado button[data-n="' + g.p.sum + '"]');
      ok('Acierto con 2 pistas y 1 fallo: 2 ⭐ (no 3) y se pierde la racha', g.equipos[1].pts === 2 && g.equipos[1].racha === 0, 'pts=' + g.equipos[1].pts);
      clic(P, '[data-act=sig]');
      /* equipo 3 pide ayuda al equipo 1 */
      ok('Hay botón «Pedir ayuda»', !!d.querySelector('#bAyuda'));
      clic(P, '#bAyuda'); ok('Ayuda: pregunta qué equipo ayuda (y no ofrece el propio)', d.querySelectorAll('[data-act=eligeAyuda]').length === 2 && !/Jirafas/.test(txt(P, '#capa .fila')));
      clic(P, '[data-act=eligeAyuda][data-i="0"]'); ok('Ayuda: queda marcada, mensaje a la clase y botón desactivado', g.ayudaDe === 0 && /ayudan/.test(txt(P, '#msg')) && d.querySelector('#bAyuda').disabled);
      clic(P, '#teclado button[data-n="' + g.p.sum + '"]');
      ok('Con ayuda: quien responde gana 2 ⭐ y quien ayuda 1 ⭐ extra (Leones 3→4)', g.equipos[2].pts === 2 && g.equipos[0].pts === 4 && g.equipos[0].ayudas === 1, g.equipos.map(function (e) { return e.pts; }).join());
      clic(P, '[data-act=sig]');
      /* rondas 2 y 3: todos aciertan a la primera */
      for (var r = 0; r < 6; r++) { var gg = w.SumaSafari.estado.g; if (w.SumaSafari.estado.p !== 'juego') break; clic(P, '#teclado button[data-n="' + gg.p.sum + '"]'); clic(P, '[data-act=sig]'); }
      ok('Tras 3 rondas × 3 equipos se llega al podio', w.SumaSafari.estado.p === 'podio' && /Podio/.test(txt(P, 'h1')), w.SumaSafari.estado.p);
      var puestos = d.querySelectorAll('.puesto').length; ok('Podio: 3 puestos con puntos, resumen para la maestra y premio de compañerismo', puestos === 3 && /Resumen para la maestra/.test(d.body.textContent) && /compañerismo/.test(d.body.textContent) && /Sumas resueltas: 9/.test(d.body.textContent));
      ok('Racha: 3 aciertos seguidos sin ayuda dan +1 ⭐ (Leones: 3+1+3+3+1 = 11), Elefantes y Jirafas 8, y sale «Mejor racha»', g.equipos[0].mejorRacha === 3 && g.equipos.map(function (e) { return e.pts; }).join() === '11,8,8' && /Mejor racha/.test(d.body.textContent) && /Ganan los 🦁 Leones/.test(d.body.textContent), g.equipos.map(function (e) { return e.pts; }).join());
      clic(P, '[data-act=diploma]'); return esp(150);
    }).then(function () {
      ok('Diploma: se rellena con el equipo ganador y llama a imprimir', /DIPLOMA/.test(d.querySelector('#diploma').textContent) && w.__print === 1);
      /* ---------- Misión ---------- */
      clic(P, '[data-p=inicio]'); clic(P, '[data-p=cfgmis]'); w.SumaSafari.estado.cfg.sonido = false; w.SumaSafari.estado.cfg.voz = false; clic(P, '[data-act=empezarMis]');
      var m = w.SumaSafari.estado.g;
      ok('Misión: ruta de 12 paradas + meta ⛺ y jeep', d.querySelectorAll('.parada').length === 12 && d.querySelector('.parada.meta') && d.querySelector('#jeep'));
      var niveles = [];
      for (var k = 0; k < 12; k++) {
        m = w.SumaSafari.estado.g; niveles.push(m.p.nivel);
        if (k === 1) { var mal2 = m.p.sum === 10 ? 9 : m.p.sum + 1; clic(P, '#teclado button[data-n="' + mal2 + '"]'); }  /* una parada con fallo: no da estrella pero avanza */
        clic(P, '#teclado button[data-n="' + m.p.sum + '"]'); clic(P, '[data-act=sig]');
      }
      ok('Misión: niveles 1,1,1,1,2,2,2,2,3,3,3,3 (la dificultad sube a lo largo del camino)', niveles.join() === '1,1,1,1,2,2,2,2,3,3,3,3', niveles.join());
      ok('Misión: al acabar sale «Hemos llegado», 11 de 12 sin ayuda y 3 estrellas', w.SumaSafari.estado.p === 'finmis' && /11 de 12/.test(d.body.textContent) && (d.querySelector('.estr').textContent.match(/⭐/g) || []).length === 3);
      /* ---------- Sin pistas ---------- */
      clic(P, '[data-p=inicio]'); clic(P, '[data-p=cfgcamp]'); clic(P, '[data-k=pistas][data-v="false"]'); clic(P, '[data-k=ayuda][data-v="false"]'); w.SumaSafari.estado.cfg.sonido = false; w.SumaSafari.estado.cfg.voz = false; clic(P, '[data-act=empezarCamp]');
      ok('Sin pistas ni ayuda: no hay botones de pista ni de ayuda', !d.querySelector('[data-act=pista]') && !d.querySelector('#bAyuda') && /sin pistas/i.test(txt(P, '#panelPista')));
      var g3 = w.SumaSafari.estado.g, mal3 = g3.p.sum === 10 ? 9 : g3.p.sum + 1; clic(P, '#teclado button[data-n="' + mal3 + '"]'); clic(P, '#teclado button[data-n="' + g3.p.sum + '"]');
      ok('Sin pistas: un fallo baja la puntuación igualmente (2 ⭐)', g3.equipos[0].pts === 2, g3.equipos[0].pts);
      /* teclado físico */
      clic(P, '[data-act=sig]'); var g4 = w.SumaSafari.estado.g; var tecla = g4.p.sum === 10 ? '0' : String(g4.p.sum);
      d.dispatchEvent(new w.KeyboardEvent('keydown', { key: tecla, bubbles: true })); ok('Teclado: la tecla del número responde', g4.resuelto === true);
      ok('Sin errores de JavaScript en toda la sesión', P.errs.length === 0, P.errs.join(' | '));
      console.log(fallos ? '\nHAY ' + fallos + ' FALLOS' : '\nTodo bien'); process.exit(fallos ? 1 : 0);
    });
  });
}).catch(function (e) { console.log('FALLO  ' + (e && e.stack || e)); process.exit(1); });
