# Tạo lại lời dẫn (const VOICE) trong tot-nghiep-animation.html bằng Edge TTS. Chạy: python3 voice.py
# Đọc NARR trong file: mỗi dòng "chữ hiển thị|chữ đọc" → đọc phần sau "|" nếu có.
# ponytail: giọng nam duy nhất của Edge là NamMinh (giọng Bắc); muốn giọng Nam thì thay bằng file thu âm/Zalo AI rồi nhúng base64 như dưới.
import asyncio, base64, json, re, sys
import edge_tts

F = 'tot-nghiep-animation.html'
VOICE_NAME, RATE = 'vi-VN-NamMinhNeural', '-5%'

src = open(F, encoding='utf-8').read()
narr = re.search(r'const NARR = \{\n(.*?)\n\};', src, re.S).group(1)
scenes = {m[0]: re.findall(r"'([^']*)'", m[1]) for m in re.findall(r"^\s*(\w+): \[(.*)\],?$", narr, re.M)}
assert len(scenes) == 9, scenes.keys()

async def tts(text):
    for i in range(6):  # server Edge giới hạn tần suất, hay trả rỗng → chờ lâu dần rồi thử lại
        try:
            out = b''
            async for ch in edge_tts.Communicate(text, VOICE_NAME, rate=RATE).stream():
                if ch['type'] == 'audio': out += ch['data']
            return out
        except edge_tts.exceptions.NoAudioReceived:
            if i == 5: raise
            await asyncio.sleep(5 * (i + 1))

async def main():
    voice = {}
    for k, lines in scenes.items():
        text = ' '.join(l.split('|')[-1] for l in lines)
        mp3 = await tts(text)
        assert len(mp3) > 2000, k
        voice[k] = 'data:audio/mpeg;base64,' + base64.b64encode(mp3).decode()
        print(k, len(mp3) // 1024, 'KB', text[:60], file=sys.stderr, flush=True)
        await asyncio.sleep(3)
    line = 'const VOICE = ' + json.dumps(voice, ensure_ascii=False) + ';'
    new, n = re.subn(r'^const VOICE = \{.*\};$', lambda _: line, src, flags=re.M)
    assert n == 1
    open(F, 'w', encoding='utf-8').write(new)

asyncio.run(main())
