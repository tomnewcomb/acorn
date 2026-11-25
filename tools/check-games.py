"""Check the recovered-game artifacts without running original software.
Run: python tools/check-games.py (Pillow required by the extraction module).
"""
import hashlib
import importlib.util
import json
import struct
import wave
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('archive_games', Path(__file__).with_name('archive-games.py'))
extract = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract)

for ident, directory, archive in [('bill','!Bill','Bill-original.zip'),('slippertron','!SlippTron','SlippTron-original.zip'),('3dtron','!3DTron','3DTron-original.zip')]:
    root = ROOT / 'programs' / ident
    exhibit = json.loads((root / 'exhibit.json').read_text())
    files = json.loads((root / 'files.json').read_text())
    with ZipFile(root / archive) as z:
        originals = {name.split('/',1)[1]:z.read(name) for name in z.namelist() if not name.endswith('/')}
        assert set(originals) == {f['name'] for f in files}
        for f in files:
            raw = (root / 'originals' / f['name']).read_bytes()
            assert raw == originals[f['name']], f['name']
            assert len(raw) == f['bytes']
    for source in exhibit['sources']:
        raw = (root / 'originals' / source['name']).read_bytes()
        text = (root / source['url']).read_text()
        assert extract.decode_basic(raw) == text
        lines = text.splitlines()
        numbers = [int(line.split()[0]) for line in lines]
        assert len(lines) == source['lines'] == len(set(numbers))
        starts = [n['start'] for n in source['annotations']]
        assert starts[0] == numbers[0] and starts == sorted(set(starts))
        assert all(n in numbers for n in starts)
        assert all(n['paragraphs'] and all(n['paragraphs']) for n in source['annotations'])
        for n in source['annotations']:
            assert 'PROCreset' not in n['title']
    for sprite in exhibit['sprites']:
        from PIL import Image
        with Image.open(root / 'sprites' / sprite['file']) as im:
            assert im.size == (sprite['displayWidth'], sprite['displayHeight'])
    for bug in exhibit['bugs']:
        assert bug['confidence'] and bug['lines'] and bug['paragraphs']
    print(ident, len(files), 'unchanged original files;', sum(s['lines'] for s in exhibit['sources']), 'complete source lines;', len(exhibit['bugs']), 'audit entries')

root = ROOT / 'programs/3dtron'
for sound in json.loads((root / 'audio/manifest.json').read_text()):
    raw = (root / 'audio' / (sound['name']+'.raw')).read_bytes()
    module = (root / 'originals/Sounds' / (sound['name']+',ffa')).read_bytes()
    assert len(raw) == sound['samples']
    assert raw == module[sound['offset']:sound['offset']+len(raw)]
    for file, rate, samples in [(sound['native'],sound['recordedRate'],len(raw)),(sound['file'],20833,len(range(0,len(raw)*256,143)))]:
        with wave.open(str(root / 'audio' / file),'rb') as w:
            assert (w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getnframes()) == (1,2,rate,samples)
            if file == sound['native']:
                expected = struct.pack('<'+'h'*len(raw), *((c if c<128 else c-256)*256 for c in raw))
                assert w.readframes(samples) == expected
projection = json.loads((root/'projection.json').read_text())
assert projection['width'] == 320 and projection['height'] == len(projection['rows']) == 117
assert all(sum(span[0] for span in row) == 320 for row in projection['rows'])
assert sum(len(row) for row in projection['rows']) == 1433
before = hashlib.sha256((root/'projection.json').read_bytes()).hexdigest()
extract.projection()
assert before == hashlib.sha256((root/'projection.json').read_bytes()).hexdigest()
print('Verified nine PCM effects, stored rates, WAVs and exact regenerated DISPCODE sampling spans.')
