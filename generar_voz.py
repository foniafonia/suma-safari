"""Voz de «Safari de las Sumas»: Ximena, de Microsoft (es-ES-XimenaNeural), con edge-tts (vía gratuita, no oficial).
Decisión de José (11/11/2026). Solo se envían a Microsoft las frases de abajo: son genéricas, sin datos de nadie.
Uso:  python3 generar_voz.py [--todo]   (genera solo los que faltan en voz/*.mp3; con --todo, todos; hace falta edge-tts, ffmpeg y conexión)
Las frases se leen una detrás de otra desde la página: «tres» + «más» + «dos» + «¿cuántos son?»."""
import asyncio, pathlib, subprocess, sys, tempfile

import edge_tts

AQUI = pathlib.Path(__file__).resolve().parent
SALIDA = AQUI / 'voz'
VOZ = 'es-ES-XimenaNeural'
RITMO = '-8%'
SALIDA.mkdir(exist_ok=True)

NUM = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez']
EQ = ['Leones', 'Elefantes', 'Jirafas', 'Monos']
F = {}
for i, n in enumerate(NUM):
    F['n%d' % i] = n
F.update({
    'mas': 'más', 'son': 'son', 'cuantos': '¿Cuántos son?', 'tengo': 'Tengo', 'ymedan': 'y me dan',
    'bien1': '¡Muy bien!', 'bien2': '¡Genial!', 'bien3': '¡Eso es!',
    'casi': 'Casi, vamos a mirarlo juntos.', 'juntos': 'Pensad juntos.',
    'sinayuda': '¡Sin ayuda! Fenomenal.', 'resuelto': '¡Lo hemos resuelto juntos!',
    'racha': '¡Racha de tres! Un punto extra.', 'llegamos': '¡Hemos llegado al campamento!',
    'empate': '¡Empate! ¡Qué buen campeonato!', 'meta': '¡La clase ha conseguido la meta entre todos!',
    'clase': 'Turno de la clase. ¿Quién sale a la pizarra?', 'bienvenida': 'Bienvenidos al Safari de las Sumas.',
    # cámara y manos
    'ens': 'Enséñame', 'unamano': 'dedos en una mano, y', 'otramano': 'en la otra.', 'condedos': 'con los dedos.',
    'conseguido': '¡Lo has conseguido!', 'dosmanos': 'Necesito ver las dos manos.', 'manoscam': 'Enséñame tus manos a la cámara.',
    # mover y juntar
    'pon': 'Pon', 'izq': 'a la izquierda, y', 'der': 'a la derecha.', 'juntamos': '¡Ahora los juntamos!',
    'muevedib': 'Mueve los dibujos con el dedo.', 'cuentalado': 'Mira cuántos hay en cada lado.',
})
for i, e in enumerate(EQ):
    F['turno%d' % i] = 'Turno de los %s.' % e
    F['bien_eq%d' % i] = '¡Muy bien, %s!' % e
    F['ganan%d' % i] = '¡Ganan los %s!' % e
    F['ayudan%d' % i] = 'Los %s ayudan.' % e


async def genera(tmp):
    for nombre, texto in F.items():
        if (SALIDA / (nombre + '.mp3')).exists() and '--todo' not in sys.argv:
            continue
        crudo = pathlib.Path(tmp) / (nombre + '.mp3')
        await edge_tts.Communicate(texto, VOZ, rate=RITMO).save(str(crudo))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(crudo), '-af',
                        'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse',
                        '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', str(SALIDA / (nombre + '.mp3'))], check=True)

with tempfile.TemporaryDirectory() as tmp:
    asyncio.run(genera(tmp))
print('frases: %d · peso: %.0f KB' % (len(F), sum(f.stat().st_size for f in SALIDA.glob('*.mp3')) / 1e3))
