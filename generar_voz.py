"""Voz de «Safari de las Sumas»: dice cada frase con Piper (Open Home Foundation), modelo es_ES-sharvard-medium,
el mismo que usa Fönia (licencia CC BY 3.0: hay que citarla; está citada en la pantalla de inicio y en «Para la maestra»).
Uso:  python3 generar_voz.py      (genera voz/*.mp3; hace falta ffmpeg y el modelo de ~/Developer/voz-logopedia/modelos)
Las frases se leen una detrás de otra desde la página: «tres» + «más» + «dos» + «¿cuántos son?»."""
import pathlib, subprocess, sys, tempfile, wave

AQUI = pathlib.Path(__file__).resolve().parent
SALIDA = AQUI / 'voz'
MODELO = pathlib.Path.home() / 'Developer/voz-logopedia/modelos/es_ES-sharvard-medium.onnx'
if not MODELO.exists():
    sys.exit('Falta el modelo de Piper: ' + str(MODELO))
SALIDA.mkdir(exist_ok=True)

NUM = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez']
EQ = ['Leones', 'Elefantes', 'Jirafas', 'Monos']
F = {}
for i, n in enumerate(NUM):
    F['n%d' % i] = n
F.update({
    'mas': 'más', 'son': 'son', 'cuantos': '¿Cuántos son?', 'tengo': 'Tengo', 'ymedan': 'y me dan',
    'bien1': '¡Muy bien!', 'bien2': '¡Genial!', 'bien3': '¡Eso es!',
    'casi': 'Casi. Vamos a mirarlo juntos.', 'juntos': 'Pensad juntos.',
    'sinayuda': '¡Sin ayuda! Fenomenal.', 'resuelto': '¡Lo hemos resuelto juntos!',
    'racha': '¡Racha de tres! Un punto extra.', 'llegamos': '¡Hemos llegado al campamento!',
    'empate': '¡Empate! ¡Qué buen campeonato!', 'meta': '¡La clase ha conseguido la meta entre todos!',
    'clase': 'Turno de la clase. ¿Quién sale a la pizarra?', 'bienvenida': 'Bienvenidos al Safari de las Sumas.',
})
for i, e in enumerate(EQ):
    F['turno%d' % i] = 'Turno de los %s.' % e
    F['bien_eq%d' % i] = '¡Muy bien, %s!' % e
    F['ganan%d' % i] = '¡Ganan los %s!' % e
    F['ayudan%d' % i] = 'Los %s ayudan.' % e

from piper import PiperVoice, SynthesisConfig
voz = PiperVoice.load(str(MODELO), config_path=str(MODELO) + '.json')
cfg = SynthesisConfig(speaker_id=0, length_scale=1.12)
with tempfile.TemporaryDirectory() as tmp:
    for nombre, texto in F.items():
        wav = pathlib.Path(tmp) / (nombre + '.wav')
        with wave.open(str(wav), 'wb') as w:
            voz.synthesize_wav(texto, w, syn_config=cfg)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse',
                        '-ar', '22050', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '56k', str(SALIDA / (nombre + '.mp3'))], check=True)
print('frases: %d · peso: %.0f KB' % (len(F), sum(f.stat().st_size for f in SALIDA.glob('*.mp3')) / 1e3))
