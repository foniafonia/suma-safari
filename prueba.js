/* node -r /Users/joseaserraf/Developer/TRASPASO-FONIA/v13/jsdom-ruta.cjs prueba.js
   Prueba la lógica (niveles, rondas, puntos, podio) y la pantalla (jsdom, sin red ni navegador): campeonato, misión, ayuda, pistas, aprende. */
var path = require('path'), fallos = 0;
function ok(n, c, x) { if (!c) fallos++; console.log((c ? 'ok     ' : 'FALLO  ') + n + (x !== undefined ? '  ' + x : '')); }
var JD = require('/Users/joseaserraf/Developer/ACADEMIA-MEMBRESIA-LOGOPED-IA-visual/node_modules/jsdom'), JSDOM = JD.JSDOM, VC = JD.VirtualConsole;

function abre(pre) {
  var errs = [], vc = new VC(); vc.on('jsdomError', function (e) { errs.push(String(e.message).slice(0, 200)); });
  var RAIZ = __dirname, RECURSOS = { interceptors: [JD.requestInterceptor(function (req) { var u = req.url; if (u.indexOf('http://localhost/') !== 0) return new Response('', { status: 404 }); var f = path.join(RAIZ, decodeURIComponent(u.slice(17).split(/[?#]/)[0])); if (!require('fs').existsSync(f) || require('fs').statSync(f).isDirectory()) return new Response('', { status: 404 }); return new Response(require('fs').readFileSync(f), { status: 200, headers: { 'Content-Type': /\.js$/.test(f) ? 'application/javascript' : 'application/octet-stream' } }); })] };
  return JSDOM.fromFile(path.join(__dirname, 'index.html'), { url: 'http://localhost/', runScripts: 'dangerously', resources: RECURSOS, pretendToBeVisual: true, virtualConsole: vc,
    beforeParse: function (w) { if (pre) pre(w); w.matchMedia = function () { return { matches: false, addListener: function () { }, addEventListener: function () { } }; }; w.HTMLElement.prototype.scrollIntoView = function () { }; w.scrollTo = function () { }; w.print = function () { w.__print = (w.__print || 0) + 1; }; }
  }).then(function (dom) { var w = dom.window; return new Promise(function (r) { if (w.document.readyState === 'complete') r(); else w.addEventListener('load', function () { r(); }); }).then(function () { return { w: w, d: w.document, errs: errs }; }); });
}
var esp = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
function clic(P, sel) { var e = P.d.querySelector(sel); if (!e) throw new Error('no hay ' + sel); e.click(); }
function txt(P, sel) { var e = P.d.querySelector(sel); return e ? e.textContent.trim() : ''; }


/* ---------- voz de Piper, pictos propios, nivel fácil y marca (página nueva) ---------- */
function extra() {
  var fs = require('fs'), aud = [], hablado = [];
  var html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  return abre(function (w) {
    w.Audio = function (src) { this.src = src; aud.push(src); var s = this; this.play = function () { setTimeout(function () { s.onended && s.onended(); }, 3); return Promise.resolve(); }; this.pause = function () { }; };
  }).then(function (P) {
    var w = P.w, d = P.d, L = w.SumaSafari, c = L.estado.cfg;
    ok('Marca: la portada trae el logo de Fönia, «Colmenia» y su lema, y los créditos citan a Ximena (Microsoft)', d.querySelector('.portada img').getAttribute('src') === 'img/fonia.jpg' && /Colmenia/.test(txt(P, '.portada')) && /Aprendemos · Creamos · Transformamos/.test(txt(P, '.portada')) && /Ximena/.test(txt(P, '.creditos')) && /Fönia/.test(txt(P, '.creditos')) && d.querySelector('#top .firma img'));
    ok('Marca: el logo existe en disco', fs.existsSync(path.join(__dirname, 'img/fonia.jpg')));
    var temas = /var TEMAS = \[([^\]]+)\]/.exec(html)[1].match(/'([^']+)'/g).map(function (x) { return x.replace(/'/g, ''); });
    ok('Pictos propios: los ' + temas.length + ' pictogramas de la lista existen en pictos/', temas.length >= 10 && temas.every(function (t) { return fs.existsSync(path.join(__dirname, 'pictos', t + '.png')); }), temas.filter(function (t) { return !fs.existsSync(path.join(__dirname, 'pictos', t + '.png')); }).join());
    var ids = ['mas', 'son', 'cuantos', 'casi', 'juntos', 'sinayuda', 'resuelto', 'racha', 'llegamos', 'empate', 'bien1', 'bien2', 'bien3', 'clase'];
    for (var k = 0; k <= 10; k++) ids.push('n' + k); for (k = 0; k < 4; k++) ids.push('turno' + k, 'bien_eq' + k, 'ganan' + k, 'ayudan' + k);
    ok('Voz Ximena: existen los ' + ids.length + ' audios (números, frases y equipos)', ids.every(function (i) { return fs.existsSync(path.join(__dirname, 'voz', i + '.mp3')); }), ids.filter(function (i) { return !fs.existsSync(path.join(__dirname, 'voz', i + '.mp3')); }).join());
    var usados = html.match(/hablar\(\[[^\]]*\]/g) || [];
    ok('Voz: todos los audios que pide el código existen', usados.every(function (u) { return (u.match(/'([a-z_0-9]+)'/g) || []).every(function (x) { var n = x.replace(/'/g, ''); return /^(n|turno|ganan|ayudan|bien_eq)$/.test(n) || fs.existsSync(path.join(__dirname, 'voz', n + '.mp3')); }); }));
    /* nivel por defecto: empieza fácil */
    c.sonido = false; c.voz = true; c.equipos = 3; c.rondas = 5; c.nivel = 'prog';
    clic(P, '[data-p=cfgcamp]'); clic(P, '[data-act=empezarCamp]');
    var g = L.estado.g;
    ok('Nivel fácil: con «Va subiendo» la primera suma es de «Primeros pasos» (hasta 3), con solo 5 teclas y dibujos de los pictos', g.p.nivel === 0 && g.p.sum <= 3 && d.querySelectorAll('#teclado button').length === 5 && d.querySelectorAll('.pregunta .it img').length === g.p.sum && /^pictos\/[a-z]+\.png$/.test(d.querySelector('.pregunta .it img').getAttribute('src')), g.p.a + '+' + g.p.b);
    return esp(700).then(function () {
      var esperado = ['voz/turno0.mp3', 'voz/n' + g.p.a + '.mp3', 'voz/mas.mp3', 'voz/n' + g.p.b + '.mp3', 'voz/cuantos.mp3'];
      ok('Voz: la pregunta suena en orden «Turno de los Leones · tres · más · dos · ¿cuántos son?»', aud.join() === esperado.join(), aud.join(' '));
      aud.length = 0; clic(P, '#teclado button[data-n="' + g.p.sum + '"]');
      return esp(300);
    }).then(function () {
      var esp1 = ['voz/n' + g.p.a + '.mp3', 'voz/mas.mp3', 'voz/n' + g.p.b + '.mp3', 'voz/son.mp3', 'voz/n' + g.p.sum + '.mp3', 'voz/bien_eq0.mp3'];
      ok('Voz: al acertar dice «a más b son c» y «¡Muy bien, Leones!»', aud.join() === esp1.join(), aud.join(' '));
      /* si un audio no carga, lee el texto con la voz del aparato */
      w.Audio = function (src) { var s = this; this.play = function () { setTimeout(function () { s.onerror && s.onerror(); }, 3); return Promise.resolve(); }; this.pause = function () { }; };
      w.SpeechSynthesisUtterance = function (t) { this.text = t; }; w.speechSynthesis = { cancel: function () { }, speak: function (u) { hablado.push(u.text); } };
      clic(P, '[data-act=sig]'); return esp(600);
    }).then(function () {
      ok('Voz: si falla el audio, lee la pregunta con la voz del aparato («Turno de los Elefantes. dos más uno…»)', hablado.length >= 1 && /Turno de los Elefantes/.test(hablado[0]) && /más/.test(hablado[0]), hablado[0]);
      c.voz = false; hablado.length = 0; aud.length = 0; clic(P, '[data-act=oir]');
      return esp(500);
    }).then(function () {
      ok('Voz apagada (🗣️): no suena nada', aud.length === 0 && hablado.length === 0);
      /* misión: la primera parada también es «Primeros pasos» */
      clic(P, '[data-p=inicio]'); clic(P, '[data-p=cfgmis]'); clic(P, '[data-act=empezarMis]');
      var m = L.estado.g; ok('Misión: arranca en «Primeros pasos» (suma ≤ 3) con 5 teclas', m.p.nivel === 0 && m.p.sum <= 3 && d.querySelectorAll('#teclado button').length === 5);
      clic(P, '[data-p=inicio]'); clic(P, '[data-p=cfgcamp]');
      ok('Ajustes: el nivel «Hasta 3» y «Va subiendo (empieza fácil)» se pueden elegir', /Hasta 3/.test(d.body.textContent) && /empieza fácil/.test(d.body.textContent));
      ok('Sin errores de JavaScript en la sesión de voz', P.errs.length === 0, P.errs.join(' | '));
    });
  });
}

/* ---------- «mis pictos en todos lados»: ningún emoji a la vista; todo sale de pictos/ ---------- */
function extra2() {
  var fs = require('fs'), RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}⭐⛶✅]/u;
  return abre().then(function (P) {
    var w = P.w, d = P.d, L = w.SumaSafari, c = L.estado.cfg, src = [];
    c.sonido = false; c.voz = false;
    function revisa(nombre) {
      var t = ['#top', '#app', '#capa', '#diploma'].map(function (q) { return d.querySelector(q).textContent; }).join(' ').replace(/[▶➜✓−×⛶]/g, ''); var imgs = [].slice.call(d.querySelectorAll('img')).map(function (i) { return i.getAttribute('src'); });
      imgs.forEach(function (x) { if (/^pictos\//.test(x) && src.indexOf(x) < 0) src.push(x); });
      var malos = imgs.filter(function (x) { return /^pictos\//.test(x) && !fs.existsSync(path.join(__dirname, x)); });
      ok('Pictos en «' + nombre + '»: ningún emoji suelto en el texto y todas las imágenes existen', !RE.test(t) && malos.length === 0, (t.match(RE) || []).join('') + ' ' + malos.join());
    }
    revisa('inicio'); clic(P, '[data-p=aprende]'); revisa('aprende'); clic(P, '[data-p=inicio]'); clic(P, '[data-p=maestra]'); revisa('para la maestra');
    clic(P, '[data-p=inicio]'); clic(P, '[data-p=cfgcamp]'); revisa('ajustes del campeonato'); clic(P, '[data-p=inicio]'); clic(P, '[data-p=cfgmis]'); revisa('ajustes de la misión');
    c.equipos = 4; c.rondas = 3; c.nivel = 'prog'; clic(P, '[data-p=inicio]'); clic(P, '[data-p=cfgcamp]'); clic(P, '[data-act=empezarCamp]');
    revisa('campeonato (pregunta)'); clic(P, '[data-act=pista]'); revisa('campeonato (con pista)'); clic(P, '#bAyuda'); revisa('pedir ayuda'); clic(P, '[data-act=eligeAyuda][data-i="1"]');
    var g = L.estado.g; clic(P, '#teclado button[data-n="' + g.p.sum + '"]'); revisa('acierto');
    for (var k = 0; k < 20 && L.estado.p === 'juego'; k++) { g = L.estado.g; if (!g.resuelto) clic(P, '#teclado button[data-n="' + g.p.sum + '"]'); clic(P, '[data-act=sig]'); }
    revisa('podio'); clic(P, '[data-act=diploma]'); revisa('diploma');
    var dip = d.querySelector('#diploma'); ok('Diploma: sin emojis; logo de Fönia y copa', !RE.test(dip.textContent) && dip.querySelectorAll('img').length >= 3);
    clic(P, '[data-p=inicio]'); clic(P, '[data-p=cfgmis]'); clic(P, '[data-act=empezarMis]'); revisa('misión');
    var m = L.estado.g; for (k = 0; k < 14 && L.estado.p === 'juego'; k++) { m = L.estado.g; if (!m.resuelto) clic(P, '#teclado button[data-n="' + m.p.sum + '"]'); clic(P, '[data-act=sig]'); } revisa('fin de la misión');
    clic(P, '[data-p=inicio]'); clic(P, '[data-p=aprende]'); ok('Signos: «Aprendemos juntos» usa signo_mas y signo_igual (en la cuenta y en las 5 formas)', d.querySelectorAll('img[src="pictos/signo_mas.png"]').length >= 3 && d.querySelectorAll('img[src="pictos/signo_igual.png"]').length >= 3);
    var usados = src.sort(); console.log('        pictos usados (' + usados.length + '): ' + usados.map(function (x) { return x.replace(/^pictos\/|\.png$/g, ''); }).join(' '));
    ok('Sin errores de JavaScript con los pictos', P.errs.length === 0, P.errs.join(' | '));
  });
}

/* ---------- cámara, dedos y mover objetos (cámara y detector falsos; manos sintéticas) ---------- */
function extra3() {
  var mano = require('./sinteticas.js').mano, fs = require('fs'), RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}⭐⛶✅▶➜✓]/u;
  var llamadas = 0, paradas = 0, aud = [];
  function abreCam(conCamara) {
    return abre(function (w) {
      w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      Object.defineProperty(w.HTMLMediaElement.prototype, 'readyState', { get: function () { return 4; } });
      w.HTMLCanvasElement.prototype.getContext = function () { return null; };
      w.Audio = function (src) { var s0 = this; aud.push(src); this.play = function () { setTimeout(function () { s0.onended && s0.onended(); }, 2); return Promise.resolve(); }; this.pause = function () { }; };
      if (conCamara) Object.defineProperty(w.navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: function () { llamadas++; return Promise.resolve({ getTracks: function () { return [{ stop: function () { paradas++; } }]; } }); } } });
    }).then(function (P) {
      var M = P.w.SumaManos; P.w.__res = { landmarks: [] }; M.CAM.inyect = function () { return P.w.__res; }; M.CFG.estableN = 3; M.CFG.fps = 200;
      P.w.SumaSafari.estado.cfg.sonido = false; P.w.SumaSafari.estado.cfg.voz = true; P.M = M; return P;
    });
  }
  function acepta(P) { var b = P.d.querySelector('[data-act=camSi]'); if (b) b.click(); }
  var mano1 = function (n, o) { var e = [0, 0, 0, 0, 0]; for (var i = 0; i < n; i++) e[i] = 1; return mano(e, o); };
  function cuantasManos(n) { return n <= 5 ? [mano1(n)] : [mano1(5, { x: 0.3 }), mano1(n - 5, { x: 0.7 })]; }
  function hay(P, sel) { return !!P.d.querySelector(sel); }
  function sinEmoji(P, nombre) { var t = ['#top', '#app', '#capa'].map(function (q) { return P.d.querySelector(q).textContent; }).join(' '); ok('Pictos en «' + nombre + '»: ningún emoji ni símbolo suelto', !RE.test(t), (t.match(RE) || []).join('')); }

  return abreCam(true).then(function (P) {
    var w = P.w, d = P.d, L = w.SumaSafari, M = P.M;
    clic(P, '[data-p=dedos]');
    ok('Mis dedos: 3 modos (mis manos, enséñame el número, suma con las manos) y la cámara empieza apagada', d.querySelectorAll('[data-act=dmodo]').length === 3 && /apagada/.test(txt(P, '.camVacio')) && hay(P, '[data-act=camOn]') && !M.CAM.activa);
    sinEmoji(P, 'mis dedos');
    clic(P, '[data-act=camOn]');
    ok('Cámara: antes de encenderla pide permiso y dice que no se graba, no se guarda y no se envía nada', d.querySelector('#capa.on') && /No se graba, no se guarda y no se envía nada/.test(txt(P, '#capa')) && llamadas === 0);
    clic(P, '[data-act=camNo]'); ok('Cámara: con «Ahora no» no se enciende nada', !d.querySelector('#capa.on') && llamadas === 0 && !M.CAM.activa);
    clic(P, '[data-act=camOn]'); clic(P, '[data-act=camSi]');
    return esp(150).then(function () {
      ok('Cámara: tras aceptar se pide la cámara una vez y se ve el vídeo con su lienzo y «no se graba nada»', llamadas === 1 && M.CAM.activa && d.querySelector('#camSlot #camBox video') && d.querySelector('#camBox canvas') && /no se graba nada/.test(txt(P, '#camBox')) && hay(P, '[data-act=camOff]'));
      /* modo libre */
      w.__res = { landmarks: cuantasManos(4) }; return esp(150);
    }).then(function () {
      ok('Mis manos: ve 4 dedos y lo dice en grande, con la voz de Ximena («cuatro»)', txt(P, '#dN') === '4' && txt(P, '#camNum') === '4' && aud.indexOf('voz/n4.mp3') >= 0, txt(P, '#dN') + ' ' + aud.join());
      w.__res = { landmarks: cuantasManos(7) }; return esp(150);
    }).then(function () {
      ok('Mis manos: con las dos manos suma los dedos (5 + 2 = 7)', txt(P, '#dN') === '7');
      w.__res = { landmarks: [] }; return esp(100);
    }).then(function () {
      ok('Mis manos: sin manos, guion', txt(P, '#dN') === '–' || txt(P, '#dN') === '-');
      /* enséñame el número */
      clic(P, '[data-act=dmodo][data-m=numero]'); var D = L.estado.d, n = D.obj;
      ok('Enséñame el número: sale el número a imitar (de 1 a 3 en la primera ronda) y la cámara sigue encendida', n >= 1 && n <= 3 && /Enséñame el\s*\d/.test(txt(P, '#dPanel')) && M.CAM.activa && d.querySelector('#camSlot #camBox'));
      w.__res = { landmarks: cuantasManos(n + 1) }; return esp(150).then(function () {
        ok('Enséñame el número: con otro número NO cuenta (gemelo) y dice lo que ve', D.hecho === false && D.estrellas === 0 && /Veo/.test(txt(P, '#dVeo')));
        w.__res = { landmarks: cuantasManos(n) }; return esp(200);
      }).then(function () {
        ok('Enséñame el número: con el número bien, se mantiene 3 fotogramas y acierta: ⭐, aparece «Siguiente» y suena «lo has conseguido»', D.hecho === true && D.estrellas === 1 && d.querySelector('#bDsig').style.display !== 'none' && aud.indexOf('voz/conseguido.mp3') >= 0 && txt(P, '#dRes') === String(n));
        clic(P, '[data-act=dsig]'); ok('Siguiente: ronda 2 de 6 con otro número', D.ronda === 1 && D.hecho === false && /Ronda 2 de 6/.test(txt(P, '#dPanel')));
        /* suma con las manos */
        clic(P, '[data-act=dmodo][data-m=suma]'); var o = D.obj;
        ok('Suma con las manos: sale «a + b» con los dedos de cada mano (cada uno ≤ 5)', o.a >= 1 && o.b >= 1 && o.a <= 5 && o.b <= 5 && /Una mano con \d dedos y la otra con \d/.test(txt(P, '#dPanel')), o.a + '+' + o.b);
        w.__res = { landmarks: [mano1(o.a)] }; return esp(150).then(function () {
          ok('Suma con las manos: con una sola mano no cuenta y pide la otra («Necesito ver las dos manos»)', D.hecho === false && /Necesito ver las dos manos/.test(txt(P, '#dVeo')) && aud.indexOf('voz/dosmanos.mp3') >= 0);
          var mal = [mano1((o.a % 5) + 1, { x: 0.3 }), mano1(o.b, { x: 0.7 })];
          w.__res = { landmarks: mal }; return esp(150);
        }).then(function () {
          ok('Suma con las manos: dos manos con otros números NO cuenta (gemelo)', D.hecho === false);
          w.__res = { landmarks: [mano1(o.b, { x: 0.3 }), mano1(o.a, { x: 0.7 })] }; return esp(200);
        }).then(function () {
          ok('Suma con las manos: vale en cualquier orden (b en la izquierda, a en la derecha): ⭐ y se muestra «a + b = suma» con los signos del banco', D.hecho === true && D.estrellas === 1 && d.querySelectorAll('#dRes img[src="pictos/signo_mas.png"]').length === 1 && d.querySelectorAll('#dRes img[src="pictos/signo_igual.png"]').length === 1 && new RegExp('^' + o.a + '\\s*' + o.b + '\\s*' + o.sum + '$').test(txt(P, '#dRes').replace(/\s+/g, ' ').replace(/(\d) (\d)/g, '$1 $2').replace(/\s/g, '')) || /\d\s*\d\s*\d/.test(txt(P, '#dRes')), txt(P, '#dRes'));
          sinEmoji(P, 'mis dedos (suma, acertado)');
        });
      });
    }).then(function () {
      var D = L.estado.d; for (var g2 = 0; g2 < 8 && !D.fin; g2++) { /* pasa las rondas que falten */ D.hecho = true; D.estrellas++; clic(P, '[data-act=dsig]') ; }
      ok('Mis dedos: al acabar las 6 rondas sale el resumen con estrellas y «Otra vez»', D.fin === true && hay(P, '[data-act=dotra]') && /conseguidos/.test(txt(P, '#dPanel')));
      sinEmoji(P, 'mis dedos (final)');
      clic(P, '[data-p=inicio]');
      ok('Salir de la pantalla apaga la cámara: se paran las pistas de vídeo y desaparece el vídeo', M.CAM.activa === false && paradas === 1 && !d.querySelector('#camBox'), 'paradas=' + paradas);
      /* ---------- responder con los dedos en el campeonato ---------- */
      var c = L.estado.cfg; c.equipos = 3; c.rondas = 3; c.nivel = '1'; c.pistas = true; c.ayuda = true;
      clic(P, '[data-p=cfgcamp]'); clic(P, '[data-act=empezarCamp]'); var g = L.estado.g;
      ok('Juego: hay botón «Responder con los dedos»', hay(P, '#bCamJ') && /Responder con los dedos/.test(txt(P, '#bCamJ')));
      w.__res = { landmarks: cuantasManos(2) }; clic(P, '#bCamJ'); acepta(P);
      return esp(150).then(function () {
        ok('Juego: si al encender la cámara ya hay manos delante, NO se toman como respuesta hasta bajarlas una vez', g.fallos === 0 && !g.resuelto && M.CAM.bloq === 'inicio', 'fallos=' + g.fallos);
        w.__res = { landmarks: [] }; return esp(150);
      }).then(function () {
        ok('Juego: la cámara se monta en el hueco de la pregunta y el botón pasa a «Apagar»', M.CAM.activa && d.querySelector('#camSlot #camBox') && /Apagar la cámara/.test(txt(P, '#bCamJ')) && g.cam === true);
        var mal = g.p.sum === 5 ? 4 : g.p.sum + 1; w.__res = { landmarks: cuantasManos(mal) }; return esp(200).then(function () {
          ok('Juego: enseñar un número equivocado cuenta como fallo y tacha la tecla', g.fallos === 1 && d.querySelector('#teclado button[data-n="' + mal + '"]').classList.contains('mal') && !g.resuelto, 'fallos=' + g.fallos);
          return esp(300);
        }).then(function () {
          ok('Juego: si sigue enseñando lo mismo NO se repite el fallo (hay que cambiar o bajar las manos)', g.fallos === 1, 'fallos=' + g.fallos);
          w.__res = { landmarks: cuantasManos(g.p.sum) }; return esp(250);
        }).then(function () {
          ok('Juego: enseñar el número bien responde solo: acierta y salen las estrellas', g.resuelto === true && d.querySelector('#capa.on') && g.equipos[0].pts >= 1, 'pts=' + g.equipos[0].pts);
          var pts0 = g.equipos[0].pts; clic(P, '[data-act=sig]');
          ok('Juego: en la pregunta siguiente la cámara sigue encendida y montada', M.CAM.activa && d.querySelector('#camSlot #camBox') && paradas === 1);
          return esp(300).then(function () {
            ok('Juego: con las manos igual que antes, la pregunta nueva NO se responde sola (se espera a que cambie el número)', L.estado.g.resuelto === false, String(L.estado.g.resuelto));
            w.__res = { landmarks: [] }; return esp(120);
          }).then(function () {
            var g3 = L.estado.g; w.__res = { landmarks: cuantasManos(g3.p.sum) }; return esp(250).then(function () { ok('Juego: tras bajar las manos y enseñar el número bien, responde', g3.resuelto === true); });
          });
        });
      });
    }).then(function () {
      clic(P, '[data-act=sig]'); /* sigue la partida con el siguiente equipo */
      clic(P, '[data-p=inicio]');
      ok('Juego: al salir al inicio se apaga la cámara (2.ª parada de pistas)', M.CAM.activa === false && paradas === 2 && !d.querySelector('#camBox'), 'paradas=' + paradas);
      /* ---------- mover y juntar ---------- */
      clic(P, '[data-p=junta]'); var J = L.estado.j;
      var mesa = d.querySelector('#mesa'); mesa.getBoundingClientRect = function () { return { left: 0, top: 0, width: 1000, height: 600 }; };
      ok('Mover y juntar: pide «Pon a la izquierda y b a la derecha», con 2 zonas, una pila de dibujos (suma + 2) y un botón «Juntar»', d.querySelectorAll('.obj').length === J.p.sum + 2 && hay(P, '#zA') && hay(P, '#zB') && hay(P, '#zP') && hay(P, '#bJ') && new RegExp('Pon\\s*' + J.p.a + '\\s*a la izquierda').test(txt(P, '.consigna')), J.p.a + '+' + J.p.b);
      sinEmoji(P, 'mover y juntar');
      ok('Mover y juntar: los dibujos son pictos del banco de Fönia', /^pictos\/[a-z]+\.png$/.test(d.querySelector('.obj img').getAttribute('src')) && fs.existsSync(path.join(__dirname, d.querySelector('.obj img').getAttribute('src'))));
      var ev = function (tipo, x, y, el) { (el || d).dispatchEvent(new w.MouseEvent(tipo, { clientX: x * 10, clientY: y * 6, bubbles: true })); };
      var mueve = function (id, x, y) { var it = J.items[id], el = d.querySelector('.obj[data-id="' + id + '"]'); ev('pointerdown', it.x, it.y, el); ev('pointermove', x, y); ev('pointerup', x, y); };
      mueve(0, 20, 25);
      ok('Arrastrar: al soltar un dibujo dentro de la zona izquierda cuenta 1 allí y lo dice (voz «uno»)', J.items[0].z === 'A' && txt(P, '#cA') === '1' && aud.slice(-1)[0] === 'voz/n1.mp3', J.items[0].z + ' ' + txt(P, '#cA') + ' ' + aud.slice(-1)[0]);
      mueve(1, 70, 25); ok('Arrastrar: otro a la derecha cuenta en la zona derecha', J.items[1].z === 'B' && txt(P, '#cB') === '1');
      mueve(2, 50, 90); ok('Arrastrar: soltar fuera de las zonas lo deja en la pila', J.items[2].z === 'P');
      mueve(0, 50, 90); ok('Arrastrar: sacar uno de la zona lo devuelve a la pila y baja la cuenta', J.items[0].z === 'P' && txt(P, '#cA') === '0');
      clic(P, '[data-act=jjuntar]'); ok('Juntar con cantidades equivocadas: no se junta, explica cuántos hay y qué hace falta (sin riñas)', J.hecho === false && J.errores === 1 && /Ahora hay \d a la izquierda y \d a la derecha/.test(txt(P, '#jMsg')) && aud.slice(-1)[0] === 'voz/cuentalado.mp3');
      /* ahora bien: a a la izquierda y b a la derecha */
      var libres = J.items.filter(function (it) { return it.z === 'P'; }).map(function (it) { return it.id; }), usados = 0;
      J.items.filter(function (it) { return it.z === 'B'; }).forEach(function (it) { mueve(it.id, 50, 90); });
      libres = J.items.filter(function (it) { return it.z === 'P'; }).map(function (it) { return it.id; });
      for (var i = 0; i < J.p.a; i++) mueve(libres[usados++], 15 + 3 * i, 20 + 3 * i);
      for (i = 0; i < J.p.b; i++) mueve(libres[usados++], 65 + 3 * i, 20 + 3 * i);
      ok('Arrastrar: ' + J.p.a + ' a la izquierda y ' + J.p.b + ' a la derecha, los dos contadores se ponen en verde', txt(P, '#cA') === String(J.p.a) && txt(P, '#cB') === String(J.p.b) && d.querySelector('#cA').classList.contains('ok') && d.querySelector('#cB').classList.contains('ok'));
      clic(P, '[data-act=jjuntar]');
      ok('Juntar bien: los dibujos pasan al centro y la voz dice «¡Ahora los juntamos!»', J.hecho === true && d.querySelector('#mesa').classList.contains('junta') && J.items.filter(function (it) { return it.z === 'C'; }).length === J.p.sum && aud.slice(-1)[0] === 'voz/juntamos.mp3');
      return esp((J.p.sum * 650) + 1800).then(function () {
        ok('Juntar: cuenta los dibujos uno a uno y al final enseña «a + b = suma» con los signos del banco y el botón «Siguiente»', d.querySelectorAll('#jRes img[src="pictos/signo_mas.png"]').length === 1 && d.querySelector('#bJsig').style.display !== 'none' && J.estrellas === 1 && aud.indexOf('voz/conseguido.mp3') >= 0, txt(P, '#jRes'));
        sinEmoji(P, 'mover y juntar (resuelto)');
        J.ronda = J.rondas - 1; clic(P, '[data-act=jsig]');
      });
    }).then(function () {
      ok('Mover y juntar: al terminar sale el resumen con estrellas y «Otra vez»', L.estado.p === 'finjunta' && hay(P, '[data-act=jotra]'));
      sinEmoji(P, 'fin de mover y juntar');
      /* ---------- la mano como ratón: pinza para coger ---------- */
      clic(P, '[data-act=jotra]'); var J2 = L.estado.j, mesa2 = d.querySelector('#mesa'); mesa2.getBoundingClientRect = function () { return { left: 0, top: 0, width: 1000, height: 600 }; };
      clic(P, '[data-act=jmano]'); acepta(P);
      return esp(150).then(function () {
        ok('Mover con la mano: la cámara se enciende en la pantalla de mover', M.CAM.activa && d.querySelector('#camSlot #camBox') && /Apagar la cámara/.test(txt(P, '.acciones')));
        var it = J2.items[0], pt0 = { x: it.x, y: it.y };
        function pinzaEn(X, Y, cerrada) { var q = { x: 1 - (0.1 + X / 100 * 0.8), y: 0.1 + Y / 100 * 0.8 }, m = mano([0, 1, 0, 0, 0]); var sep = cerrada ? 0.012 : 0.25; m[8] = { x: q.x - sep / 2, y: q.y, z: 0 }; m[4] = { x: q.x + sep / 2, y: q.y, z: 0 }; return { landmarks: [m] }; }
        w.__res = pinzaEn(pt0.x, pt0.y, false); return esp(100).then(function () {
          ok('Mano: se ve el cursor morado en la mesa mientras hay una mano', d.querySelector('#curM').style.display === 'block' && !d.querySelector('#curM').classList.contains('pinza'));
          w.__res = pinzaEn(pt0.x, pt0.y, true); return esp(100);
        }).then(function () {
          ok('Mano: al cerrar la pinza sobre un dibujo lo coge (se levanta y el cursor se rellena)', J2.arr === 0 && d.querySelector('#curM').classList.contains('pinza') && d.querySelector('.obj[data-id="0"]').classList.contains('arr'), 'arr=' + J2.arr);
          w.__res = pinzaEn(25, 28, true); return esp(100);
        }).then(function () {
          ok('Mano: moviendo la pinza arrastra el dibujo hasta la zona izquierda', J2.items[0].x > 15 && J2.items[0].x < 35 && J2.items[0].y > 20 && J2.items[0].y < 35, J2.items[0].x.toFixed(0) + ',' + J2.items[0].y.toFixed(0));
          w.__res = pinzaEn(25, 28, false); return esp(100);
        }).then(function () {
          ok('Mano: al abrir los dedos suelta el dibujo dentro de la zona izquierda (cuenta 1 y lo dice)', J2.arr === null && J2.items[0].z === 'A' && txt(P, '#cA') === '1');
          w.__res = pinzaEn(80, 20, false); return esp(100);
        }).then(function () {
          /* abrir la mano lejos de un dibujo no coge nada */
          w.__res = pinzaEn(90, 40, true); return esp(100);
        }).then(function () {
          ok('Mano: cerrar la pinza donde no hay ningún dibujo no coge nada (gemelo)', J2.arr === null);
          w.__res = { landmarks: [] }; return esp(100);
        }).then(function () {
          ok('Mano: sin mano el cursor desaparece', d.querySelector('#curM').style.display === 'none');
          sinEmoji(P, 'mover con la mano');
          clic(P, '[data-act=jmanoOff]'); ok('Apagar la cámara desde mover y juntar la para', M.CAM.activa === false && paradas === 3, 'paradas=' + paradas);
        });
      });
    }).then(function () {
      ok('Sin errores de JavaScript con cámara, dedos y mover objetos', P.errs.length === 0, P.errs.join(' | '));
      return abreCam(false);
    }).then(function (P2) {
      clic(P2, '[data-p=dedos]'); clic(P2, '[data-act=camOn]'); clic(P2, '[data-act=camSi]'); return esp(120).then(function () {
        ok('Sin cámara en el aparato: lo dice con claridad y no se rompe nada', /no tiene cámara/.test(txt(P2, '#camAviso')) && !P2.M.CAM.activa && P2.errs.length === 0, txt(P2, '#camAviso'));
        clic(P2, '[data-act=dmodo][data-m=numero]'); ok('Sin cámara: el modo «enséñame el número» se puede mirar igualmente', /Enséñame el\s*\d/.test(txt(P2, '#dPanel')));
      });
    });
  });
}
function S_p(L) { return L.estado.p; }

abre().then(function (P) {
  var L = P.w.SumaSafari, w = P.w, d = P.d;
  /* ---------- lógica ---------- */
  var rngs = (function () { var s = 7; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  var bien = true, N = 400, i, p;
  for (i = 0; i < N; i++) { var niv = i % 4; p = L.genProblema(niv, null, rngs); if (p.a < 1 || p.b < 1 || p.a + p.b !== p.sum || p.sum < L.NIVELES[niv].min || p.sum > L.NIVELES[niv].max) bien = false; }
  ok('genProblema: 400 problemas, sumandos ≥ 1 y suma dentro del nivel (hasta 3, 5, 7 y 10)', bien);
  var us = {}, ds = {}; for (i = 0; i < 3; i++) { p = L.genProblema(0, us, rngs); ds[p.a + '+' + p.b] = 1; }
  ok('genProblema: «Primeros pasos» solo tiene 1+1, 1+2 y 2+1, sin repetir', Object.keys(ds).length === 3 && Object.keys(ds).sort().join() === '1+1,1+2,2+1', Object.keys(ds).join());
  var ron = L.genRonda(2, 4, 0, rngs);
  ok('genRonda: los 4 equipos tienen la MISMA suma, y repartida de formas distintas', ron.every(function (x) { return x.sum === ron[0].sum && x.a + x.b === x.sum; }) && new Set(ron.map(function (x) { return x.a; })).size === Math.min(4, ron[0].sum - 1), JSON.stringify(ron.map(function (x) { return x.a + '+' + x.b; })));
  var evita = true; for (i = 0; i < 40; i++) { if (L.genRonda(3, 2, 8, rngs)[0].sum === 8) evita = false; } ok('genRonda: no repite la suma de la ronda anterior', evita);
  ok('puntos: sin pista 3, con 1 o 2 pistas 2, con 3 o más 1', L.puntos(0) === 3 && L.puntos(1) === 2 && L.puntos(2) === 2 && L.puntos(3) === 1 && L.puntos(5) === 1);
  ok('nivelRonda (5 rondas): empieza fácil, 0,0,1,2,3 — y nunca pasa de 3', [0, 1, 2, 3, 4].map(function (r) { return L.nivelRonda(r, 5); }).join() === '0,0,1,2,3' && L.nivelRonda(7, 8) === 3 && L.nivelRonda(0, 3) === 0);
  ok('nivelParada: 3 paradas por nivel (0,0,0,1,1,1,2,2,2,3,3,3)', [0, 2, 3, 5, 6, 8, 9, 11].map(L.nivelParada).join() === '0,0,1,1,2,2,3,3');
  var rk = L.ranking([{ pts: 10, aciertos: 5 }, { pts: 12, aciertos: 4 }, { pts: 10, aciertos: 5 }, { pts: 3, aciertos: 1 }]).map(function (x) { return x.puesto; });
  ok('ranking: empates comparten puesto (1,2,2,4)', rk.join() === '1,2,2,4', rk.join());
  ok('estrellasMision: 3 estrellas con ≥ 75 %, 2 con ≥ 50 %, 1 en otro caso', L.estrellasMision(9, 12) === 3 && L.estrellasMision(6, 12) === 2 && L.estrellasMision(1, 12) === 1);

  /* ---------- pantallas ---------- */
  ok('Inicio: título y 6 tarjetas (aprende, dedos, mover, campeonato, misión, maestra)', /Safari de las Sumas/.test(txt(P, 'h1')) && d.querySelectorAll('.menu .card').length === 6);

  /* Aprendemos juntos */
  clic(P, '[data-p=aprende]');
  ok('Aprende: empieza fácil, con 2 + 1', txt(P, '.num .a') === '2' && txt(P, '.num .b') === '1' && txt(P, '.res') === '3');
  clic(P, '[data-act=da][data-w=a][data-d="1"]'); clic(P, '[data-act=da][data-w=b][data-d="1"]');
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
    ok('Campeonato: 3 equipos en el marcador, turno del primero, 5 teclas (1–5) en el nivel 1', d.querySelectorAll('.marcador .eq').length === 3 && d.querySelector('.eq.act') && /Leones/.test(txt(P, '.turno')) && d.querySelectorAll('#teclado button').length === 5, 'en el nivel 1 solo 5 teclas');
    ok('Campeonato: en el nivel 1 (apoyo «se va quitando») salen los dibujos y la suma con ?', d.querySelectorAll('.pregunta .it').length === g.p.a + g.p.b && txt(P, '#int') === '?');
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
      ok('Racha: 3 aciertos seguidos sin ayuda dan +1 ⭐ (Leones: 3+1+3+3+1 = 11), Elefantes y Jirafas 8, y sale «Mejor racha»', g.equipos[0].mejorRacha === 3 && g.equipos.map(function (e) { return e.pts; }).join() === '11,8,8' && /Mejor racha/.test(d.body.textContent) && /Ganan los\s+Leones/.test(d.body.textContent), g.equipos.map(function (e) { return e.pts; }).join());
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
      ok('Misión: niveles 0,0,0,1,1,1,2,2,2,3,3,3 (empieza fácil y sube a lo largo del camino)', niveles.join() === '0,0,0,1,1,1,2,2,2,3,3,3', niveles.join());
      ok('Misión: al acabar sale «Hemos llegado», 11 de 12 sin ayuda y 3 estrellas', w.SumaSafari.estado.p === 'finmis' && /11 de 12/.test(d.body.textContent) && d.querySelectorAll('.estr img[src="pictos/estrella.png"]').length === 3);
      /* ---------- Sin pistas ---------- */
      clic(P, '[data-p=inicio]'); clic(P, '[data-p=cfgcamp]'); clic(P, '[data-k=pistas][data-v="false"]'); clic(P, '[data-k=ayuda][data-v="false"]'); w.SumaSafari.estado.cfg.sonido = false; w.SumaSafari.estado.cfg.voz = false; clic(P, '[data-act=empezarCamp]');
      ok('Sin pistas ni ayuda: no hay botones de pista ni de ayuda', !d.querySelector('[data-act=pista]') && !d.querySelector('#bAyuda') && /sin pistas/i.test(txt(P, '#panelPista')));
      var g3 = w.SumaSafari.estado.g, mal3 = g3.p.sum === 5 ? 4 : g3.p.sum + 1; clic(P, '#teclado button[data-n="' + mal3 + '"]'); clic(P, '#teclado button[data-n="' + g3.p.sum + '"]');
      ok('Sin pistas: un fallo baja la puntuación igualmente (2 ⭐)', g3.equipos[0].pts === 2, g3.equipos[0].pts);
      /* teclado físico */
      clic(P, '[data-act=sig]'); var g4 = w.SumaSafari.estado.g; var tecla = g4.p.sum === 10 ? '0' : String(g4.p.sum);
      d.dispatchEvent(new w.KeyboardEvent('keydown', { key: tecla, bubbles: true })); ok('Teclado: la tecla del número responde', g4.resuelto === true);
      ok('Sin errores de JavaScript en toda la sesión', P.errs.length === 0, P.errs.join(' | '));
      return extra().then(extra2).then(extra3).then(function () { console.log(fallos ? '\nHAY ' + fallos + ' FALLOS' : '\nTodo bien'); process.exit(fallos ? 1 : 0); });
    });
  });
}).catch(function (e) { console.log('FALLO  ' + (e && e.stack || e)); process.exit(1); });
