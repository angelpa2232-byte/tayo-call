import contextlib
import io
import json
import sys
from pathlib import Path
from supertonic import TTS

folder = Path(__file__).parent / 'models' / 'supertonic3'
with contextlib.redirect_stdout(sys.stderr):
    tts = TTS(model='supertonic-3', model_dir=str(folder), auto_download='--prepare' in sys.argv, intra_op_num_threads=2, inter_op_num_threads=1)
def synthesize(data):
    import soundfile as sf
    voice = data.get('voice', 'M3')
    if voice not in ['M1', 'M2', 'M3', 'F3']:
        voice = 'M3'
    with contextlib.redirect_stdout(sys.stderr):
        style = tts.get_voice_style(voice_name=voice)
        wav, _ = tts.synthesize(data['text'][:400], voice_style=style, lang='ko', total_steps=6, speed=1.2, max_chunk_length=120, silence_duration=0.06)
    output = io.BytesIO()
    sf.write(output, wav.reshape(-1), tts.sample_rate, format='WAV', subtype='PCM_16')
    return output.getvalue()

if '--prepare' in sys.argv:
    print('Supertonic Korean TTS ready')
elif '--worker' in sys.argv:
    import base64
    for line in sys.stdin:
        request = {}
        try:
            request = json.loads(line)
            result = {'id': request['id'], 'audio': base64.b64encode(synthesize(request)).decode('ascii')}
        except Exception:
            import traceback
            traceback.print_exc(file=sys.stderr)
            result = {'id': request.get('id'), 'error': 'Voice synthesis failed'}
        print(json.dumps(result), flush=True)
else:
    sys.stdout.buffer.write(synthesize(json.loads(sys.stdin.read())))
