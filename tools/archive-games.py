"""Rebuild derived listings, sprites, maps and isolated voice previews.

Run from anywhere: python tools/archive-games.py
Requires Pillow. Original files under programs/*/originals are read only.
BBC token spellings in bbc-tokens.json describe the BASIC V on-disk format.
This decoder handles these supplied files; it is not a general RISC OS emulator.
"""
from pathlib import Path
import hashlib
import json
import re
import struct
import wave

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
TOKENS = json.loads(Path(__file__).with_name('bbc-tokens.json').read_text())


def decode_basic(data):
    offset, lines = 0, []
    while data[offset:offset + 2] != b'\r\xff':
        assert data[offset] == 13
        number = int.from_bytes(data[offset + 1:offset + 3], 'big')
        length = data[offset + 3]
        assert length >= 4 and offset + length <= len(data)
        body = data[offset + 4:offset + length]
        i, quoted, text = 0, False, ''
        while i < len(body):
            byte = body[i]
            i += 1
            if byte == 34:
                quoted = not quoted
                text += '"'
            elif quoted:
                text += chr(byte)
            elif byte == 141:
                a, b, c = body[i:i + 3]
                i += 3
                text += str(((((a << 4) ^ c) & 255) << 8) | (((a << 2) & 192) ^ b))
            elif byte >= 127:
                if str(byte) in TOKENS['extended']:
                    token = TOKENS['extended'][str(byte)][body[i] - 142]
                    i += 1
                else:
                    token = TOKENS['single'][byte - 127]
                assert token is not None, (number, byte)
                text += token
                if byte in (244, 220):  # REM / DATA: remainder is literal.
                    text += body[i:].decode('latin1')
                    break
            else:
                text += chr(byte)
        lines.append(f'{number} {text}')
        offset += length
    assert offset + 2 == len(data)
    return '\n'.join(lines) + '\n'


PALETTE16 = [(255,255,255),(221,221,221),(187,187,187),(153,153,153),
             (119,119,119),(85,85,85),(51,51,51),(0,0,0),
             (0,0,255),(255,255,0),(0,255,0),(255,0,0),
             (255,255,187),(0,136,85),(255,187,0),(0,187,255)]


def palette256(c):
    # VIDC's default 256-colour palette: two shared tint bits, two per gun.
    tint = c & 3
    return tuple(17 * v for v in (
        tint | (c & 4) | ((c >> 1) & 8),
        tint | ((c >> 3) & 12),
        tint | ((c >> 1) & 4) | ((c >> 4) & 8)))


def sprites(path, dest, palette):
    data = path.read_bytes()
    count, first, free = struct.unpack_from('<3I', data)
    assert free - 4 == len(data)
    offset, entries = first - 4, []
    for _ in range(count):
        size, raw, w, h, left, right, image, mask, mode = struct.unpack_from('<I12s7I', data, offset)
        name = raw.split(b'\0')[0].decode('ascii')
        bpp = {9: 4, 12: 4, 13: 8}[mode]
        width, height, row = ((w + 1) * 32 - left - (31 - right)) // bpp, h + 1, (w + 1) * 4
        colors = list(palette) if bpp == 4 else [palette256(c) for c in range(256)]
        if image > 44:
            colors = [tuple(data[offset + 44 + i * 8 + 1:offset + 44 + i * 8 + 4]) for i in range((image - 44) // 8)]
        im = Image.new('RGBA', (width, height))
        for y in range(height):
            for x in range(width):
                bit = left + x * bpp
                index = (data[offset + image + y * row + bit // 8] >> (bit % 8)) & ((1 << bpp) - 1)
                alpha = 255
                if mask != image:
                    m = (data[offset + mask + y * row + bit // 8] >> (bit % 8)) & ((1 << bpp) - 1)
                    alpha = 255 if m else 0
                im.putpixel((x, y), (*colors[index], alpha))
        if mode == 12:
            im = im.resize((width, height * 2), Image.Resampling.NEAREST)
        stem = path.relative_to(dest.parent / 'originals').as_posix().replace('/', '-').split(',')[0].replace('!', 'app')
        filename = stem + '-' + name.replace('!', '') + '.png'
        im.save(dest / filename)
        entries.append(dict(name=name, file=filename, width=width, height=height, mode=mode,
                            displayWidth=im.width, displayHeight=im.height,
                            original=path.relative_to(dest.parent / 'originals').as_posix()))
        offset += size
    assert offset == len(data)
    return entries


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')


def sound_previews():
    """Extract EMR signed PCM using the module's own data pointer and length.

    Fixed game pitch &1800 gives a phase increment of143/256 with standard
    RISC OS tuning0 (Sound1 PitchTab). Nominal output period48us. These isolated
    previews do not emulate the EMR envelope or final VIDC quantisation.
    """
    root = ROOT / 'programs/3dtron'
    dest = root / 'audio'
    dest.mkdir(exist_ok=True)
    manifest = []
    labels = dict(crash='Crash', deleteline='Delete trail', pickuppill='Pick up a pill',
                  selectpill='Select a pill', speed='Speed', start='Round start',
                  steal='Steal a pill', usemscpill='Use a pill', wrap='Wrap around')
    for path in sorted((root / 'originals/Sounds').iterdir()):
        data = path.read_bytes()
        name = path.name.split(',')[0]
        header = struct.unpack_from('<I', data, 0x38)[0]
        assert b'EMRVoiceModule' in data[:120]
        voices, flags, length, repeat_start, repeat_end = struct.unpack_from('<5I', data, header + 12)
        assert voices == 1 and flags == 0x80000000
        offset = header + 0x220
        assert offset + length + 12 == len(data)
        magic, version, rate = struct.unpack_from('<4sII', data, offset + length)
        assert magic == b'EMS2' and version == 1 and 4000 <= rate <= 48000
        raw = data[offset:offset + length]
        pcm = [c if c < 128 else c - 256 for c in raw]
        (dest / (name + '.raw')).write_bytes(raw)
        def wav(filename, samples, hz):
            with wave.open(str(dest / filename), 'wb') as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(hz)
                w.writeframes(struct.pack('<' + 'h' * len(samples), *(s * 256 for s in samples)))
        wav(name + '-native.wav', pcm, rate)
        # The EMR renderer reads before incrementing its fractional sample phase.
        played = [pcm[p // 256] for p in range(0, length * 256, 143)]
        wav(name + '.wav', played, 20833)
        manifest.append(dict(name=name, label=labels[name], samples=length, offset=offset,
                             recordedRate=rate, file=name + '.wav', native=name + '-native.wav',
                             pitch='1800', increment=143, seconds=len(played)/20833,
                             effectiveRate=1000000/48*143/256))
    write_json(dest / 'manifest.json', manifest)


def projection():
    """Recover the pixel spans of this particular unrolled ARM renderer.

    No ARM code is executed. Reject every instruction outside the known forms.
    """
    root = ROOT / 'programs/3dtron'
    data = (root / 'originals/DISPCODE,ffd').read_bytes()
    registers, pixels, sample = {}, [], None
    for offset in range(0, len(data), 4):
        word = struct.unpack_from('<I', data, offset)[0]
        if (word & 0xFFFFF000) in (0xE3A08000, 0xE3A09000, 0xE3E08000, 0xE3E09000):
            value, rotate = word & 255, ((word >> 8) & 15) * 2
            value = ((value >> rotate) | (value << (32 - rotate))) & 0xFFFFFFFF if rotate else value
            registers[(word >> 12) & 15] = ~value if (word & 0xFFF00000) == 0xE3E00000 else value
        elif word >> 24 == 0xEB:
            displacement = word & 0xFFFFFF
            if displacement & 0x800000:
                displacement -= 0x1000000
            assert offset + 8 + displacement * 4 == 0xAAA0
            sample = (registers[8], registers[9])
        elif word & 0xFFFF0000 == 0xE8A00000:
            assert word & 0xFFFF in (0x2, 0x6, 0xE, 0x1E)
            assert sample is not None
            pixels.extend([sample] * (4 * (word & 0xFFFF).bit_count()))
        elif word in (0xE4801004, 0xE4C01001):
            assert sample is not None
            pixels.extend([sample] * (4 if word == 0xE4801004 else 1))
        else:
            assert word in (0xE92D4000, 0xE8FD8000), (offset, hex(word))
    assert len(pixels) == 320 * 117
    rows = []
    for y in range(117):
        runs = []
        for lateral, longitudinal in pixels[y * 320:(y + 1) * 320]:
            if runs and runs[-1][1:] == [lateral, longitudinal]:
                runs[-1][0] += 1
            else:
                runs.append([1, lateral, longitudinal])
        rows.append(runs)
    (root / 'projection.json').write_text(json.dumps(dict(width=320, height=117, rows=rows), separators=(',', ':')))


def main():
    for ident in ('bill', 'slippertron', '3dtron'):
        root = ROOT / 'programs' / ident
        dest = root / 'sprites'
        dest.mkdir(exist_ok=True)
        palette = list(PALETTE16)
        if ident == 'bill':
            raw = (root / 'originals/Palette,fed').read_bytes()
            for i in range(0, len(raw), 6):
                assert raw[i] == 19
                if raw[i + 2] == 16:
                    palette[raw[i + 1]] = tuple(17 * (v >> 4) for v in raw[i + 3:i + 6])
        if ident == 'slippertron':
            palette[8:12] = [(0,192,192),(0,64,64),(0,128,128),(0,96,96)]
        entries, sources = [], []
        for path in sorted((root / 'originals').rglob('*')):
            if path.name.endswith(',ffb'):
                text = decode_basic(path.read_bytes())
                filename = path.name[:-4].replace('!', '') + '.txt'
                (root / filename).write_text(text)
                sources.append(dict(name=path.name, url=filename, lines=len(text.splitlines()),
                                    sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
            if path.name.endswith(',ff9'):
                entries.extend(sprites(path, dest, PALETTE16 if path.name.startswith('!') else palette))
        write_json(root / 'sprites.json', entries)
        write_json(root / 'sources.json', sources)
        print(ident, len(entries), 'sprites;', sum(s['lines'] for s in sources), 'source lines')
    root = ROOT / 'programs/bill'
    maps = [dict(name=str(n), width=20, height=15, tiles=list((root / f'originals/{n},ffd').read_bytes())) for n in range(1,11)]
    assert all(len(m['tiles']) == 300 for m in maps)
    write_json(root / 'maps.json', maps)
    # The SlipperTron logo is stored as line segments in BASIC DATA statements.
    text = (ROOT / 'programs/slippertron/RunImage.txt').read_text()
    color, lines = 1, []
    for number, values in re.findall(r'^(\d+) DATA([\d., ]+)$', text, re.M):
        if not 160 <= int(number) <= 380:
            continue
        nums = [float(x) for x in values.split(',')]
        for i in range(0, len(nums), 4):
            x1,y1,x2,y2 = nums[i:i+4]
            if (x1,y1,x2,y2) == (1,1,1,1): break
            if (x1,y1,x2,y2) == (0,0,0,0):
                color = color % 7 + 1
            else:
                colors = ['#ff0000','#00ff00','#ffff00','#0000ff','#ff00ff','#00ffff','#ffffff']
                lines.append(f'<path d="M{x1*58+30},{430-y1*200} L{x2*58+30},{430-y2*200}" stroke="{colors[color-1]}"/>')
    (ROOT / 'programs/slippertron/title.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1340 460" role="img" aria-label="SlipperTron original vector logo"><rect width="1340" height="460" fill="#000"/><g fill="none" stroke-width="7" stroke-linecap="square">'+''.join(lines)+'</g></svg>\n')
    for number, values in re.findall(r'^(\d+) VDU([\d,]+)$', text, re.M):
        if not 50 <= int(number) <= 80:
            continue
        values = [int(n) for n in values.split(',')]
        for i in range(0, len(values), 10):
            assert values[i] == 23
            char, rows = values[i+1], values[i+2:i+10]
            im = Image.new('RGBA', (8,8))
            for y,row in enumerate(rows):
                for x in range(8):
                    if row & (128 >> x): im.putpixel((x,y),(230,235,220,255))
            im.save(ROOT / f'programs/slippertron/sprites/character-{char}.png')
    # Tech is a VDU stream: mode change followed by VDU 23 character definitions.
    root = ROOT / 'programs/3dtron'
    data = (root / 'originals/Tech,ff7').read_bytes()
    assert data[:2] == bytes([22,141])
    glyphs = []
    for i in range(2,len(data),10):
        assert data[i] == 23
        glyphs.append((data[i+1],data[i+2:i+10]))
    im = Image.new('RGB', (16*40, ((len(glyphs)+15)//16)*56), '#111811')
    draw = ImageDraw.Draw(im)
    for j,(char,rows) in enumerate(glyphs):
        x,y = j%16*40, j//16*56
        for yy,row in enumerate(rows):
            for xx in range(8):
                if row & (128 >> xx):draw.rectangle((x+xx*4,y+yy*4,x+xx*4+3,y+yy*4+3),fill='#d4e7aa')
        draw.text((x+8,y+34),str(char),fill='#c4c8c4')
    im.save(root / 'font.png')
    write_json(root / 'font.json',[dict(code=c,rows=list(rows)) for c,rows in glyphs])
    sound_previews()
    projection()
    # Keep machine-derived manifests in sync; retrospective prose is retained.
    for ident in ('bill', 'slippertron', '3dtron'):
        root = ROOT / 'programs' / ident
        if not (root / 'exhibit.json').exists():
            continue
        exhibit = json.loads((root / 'exhibit.json').read_text())
        exhibit['sprites'] = json.loads((root / 'sprites.json').read_text())
        if ident == '3dtron':
            exhibit['audio'] = json.loads((root / 'audio/manifest.json').read_text())
        write_json(root / 'exhibit.json', exhibit)


if __name__ == '__main__':
    main()
