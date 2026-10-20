// Kiểm thử apple.html bằng Chrome headless qua CDP (Node 22: có sẵn WebSocket/fetch)
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
const ROOT = decodeURIComponent(new URL('.', import.meta.url).pathname).slice(0, -1); // chạy: node check.mjs (cần Google Chrome)
// Giả lập Vercel: "/" → index.html, file có thật → file, còn lại rewrite về apple.html
createServer((q, r) => {
  let p = new URL(q.url, 'http://x').pathname; try { p = decodeURIComponent(p); } catch {}
  const f = ROOT + p;
  r.setHeader('content-type', 'text/html; charset=utf-8');
  let html = readFileSync(p === '/' ? ROOT + '/index.html' : existsSync(f) && !p.endsWith('/') ? f : ROOT + '/apple.html', 'utf8');
  // ?photos=1: bơm 3 ảnh SVG + 1 ảnh hỏng để test gallery (không đụng file thật)
  if (q.url.includes('photos=1')) {
    const svg = c => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="${c}"/></svg>`);
    html = html.replace('photos: [],', `photos: [{thumb:${JSON.stringify(svg('red'))},alt:'A',caption:'Ảnh A'},{src:${JSON.stringify(svg('blue'))},alt:'B'},{src:'/__missing.jpg',alt:'hỏng'},{src:${JSON.stringify(svg('green'))},alt:'C',caption:'Ảnh C'}],`);
  }
  const album = new URL(q.url, 'http://x').searchParams.get('albumTest');
  if (album !== null) html = html.replace("albumUrl: '',", `albumUrl: ${JSON.stringify(album)},`);
  r.end(html);
}).listen(8787);

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=9333', '--user-data-dir=/tmp/inv-prof', '--no-first-run', 'about:blank']);
let ws;
for (let i = 0; i < 150 && !ws; i++) { await new Promise(r => setTimeout(r, 200));
  try { const t = await (await fetch('http://127.0.0.1:9333/json')).json(); ws = t.find(x => x.type === 'page')?.webSocketDebuggerUrl; } catch {} }
if (!ws) throw new Error('Chrome không khởi động');
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const pend = {}; const errs = [];
sock.onmessage = m => { const d = JSON.parse(m.data);
  if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; }
  if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errs.push(d.params.args.map(a => a.value).join(' ')); };
const cmd = (method, params = {}) => new Promise(r => { pend[++id] = r; sock.send(JSON.stringify({ id, method, params })); });
const ev = async e => (await cmd('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.result.value;
await cmd('Runtime.enable'); await cmd('Page.enable');
let inj;
const go = async (path, w = 1280, h = 800, now) => {
  await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
  if (inj) await cmd('Page.removeScriptToEvaluateOnNewDocument', { identifier: inj });
  inj = now ? (await cmd('Page.addScriptToEvaluateOnNewDocument', { source: `{const N=${now},D=Date,o=D.now();Date=class extends D{constructor(...a){a.length?super(...a):super(N+(D.now()-o))}static now(){return N+(D.now()-o)}}}` })).result.identifier : null;
  errs.length = 0; await cmd('Page.navigate', { url: 'http://127.0.0.1:8787' + path }); await new Promise(r => setTimeout(r, 900));
};
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const state = () => ev(`({g:document.getElementById("guest").textContent,t:document.title,eb:eyebrow.textContent,st:statement.textContent.slice(0,40),faq:faq.textContent,msg:message.textContent,cd:cdBox.textContent.replace(/\\s+/g,' ').trim().slice(0,30)})`);


const cases = [
  ['/apple.html', ''], ['/classic', ''], ['/apple', ''], ['/BaHo', 'Gửi Ba Hồ,'], ['/baho', 'Gửi Ba Hồ,'], ['/BaHo/', 'Gửi Ba Hồ,'],
  ['/Teo', 'Alo Tẹo ơi,'], ['/vychan', 'Alo Vy-chan ơi,'], ['/NguyenVanA', 'Gửi Nguyen Van A,'], ['/Nguy%E1%BB%85nV%C4%83nA', 'Gửi Nguyễn Văn A,'],
  ['/le-van_c', 'Gửi le van c,'], ['/%E0%A4%A', 'Gửi %E0%A4%A,'], ['/x?to=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E', 'Gửi <img src=x onerror=alert(1)>,'],
  ['/apple.html?to=BaHo', 'Gửi Ba Hồ,'], ['/apple.html?to=Teo', 'Alo Tẹo ơi,'], ['/apple.html?to=C%C3%B4%20Lan', 'Gửi Cô Lan,'],
];
for (const [p, exp] of cases) {
  await go(p); const s = await state();
  ok(s.g === exp && errs.length === 0 && !(await ev('!!document.querySelector("#guest *")')), `${p} → "${s.g}" ${errs.join('|')}`);
  if (p === '/Teo') ok(s.eb === 'Lệnh triệu tập khẩn cấp' && s.st.startsWith('Bốn năm. Hàng nghìn ly') && s.faq.includes('Đẹp nhất') && s.msg.includes('chịu đựng'), '/Teo nhận đủ FUN');
  if (p === '/BaHo') ok(s.eb === 'Trân trọng kính mời' && s.st.startsWith('Bốn năm. Hàng nghìn giờ') && !s.faq.includes('Đẹp nhất') && s.msg.includes('một phần'), '/BaHo giữ FORMAL');
  if (p === '/apple.html') ok(s.t === 'Thiệp mời Lễ Tốt Nghiệp' && s.g === '', 'không tên khách: title mặc định');
}
await go('/'); ok(errs.length === 0, '/ (index.html) không lỗi console');
// Countdown theo mốc (lễ 08:30 +07 = 01:30Z)
const T = Date.parse('2026-11-14T01:30:00Z');
for (const [off, exp] of [[-90061e3, '01ngày 01giờ 01phút'], [0, 'đang diễn ra'], [3600e3, 'đang diễn ra'], [3 * 3600e3, 'Cảm ơn']]) {
  await go('/apple.html', 1280, 800, T + off); const s = await state(); ok(s.cd.includes(exp), `countdown @${off / 1e3}s → "${s.cd}"`);
}
await go('/apple.html', 1280, 800, T + 3 * 3600e3 - 1500); await new Promise(r => setTimeout(r, 2200));
ok((await state()).cd.includes('Cảm ơn'), 'đang diễn ra tự chuyển sang Cảm ơn');
// Link
await go('/BaHo', 1280, 800);
const L = await ev(`[...document.querySelectorAll('a')].map(a=>({id:a.id,h:a.getAttribute('href'),t:a.target,r:a.rel}))`);
ok(L.every(a => a.h), 'mọi <a> có href ' + L.filter(a => !a.h).map(a => a.id));
ok(L.filter(a => a.t === '_blank').every(a => a.r.includes('noopener')), '_blank có noopener');
ok(decodeURIComponent(L.find(a => a.id === 'calBtn').h).includes('dates=20261114T013000Z/20261114T043000Z'), 'GCal 08:30–11:30 +07 = 01:30Z–04:30Z');
// Responsive
for (const w of [320, 375, 390, 768, 1440]) {
  await go('/Teo', w, 740);
  await ev(`scrollTo(0, 1e6), new Promise(r=>setTimeout(r,1300))`);
  const r = await ev(`(()=>{const d=dock.getBoundingClientRect(),rg=document.createRange();rg.selectNodeContents(foot);const t=rg.getBoundingClientRect();
    const wide=[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&!e.closest('.rail,.aurora,.t-venue')).map(e=>e.id||e.className||e.tagName).slice(0,5);
    return {ov:document.documentElement.scrollWidth-innerWidth,dl:d.left,dr:d.right,dt:d.top,tb:t.bottom,wide}})()`);
  ok(r.ov <= 0 && !r.wide.length, `${w}px không tràn ngang (${r.ov}) ${r.wide}`);
  if (r.wide.length) console.log(await ev(`JSON.stringify([...document.querySelectorAll('.countdown, .countdown > div, .countdown b, .t-count')].map(e=>[e.className||e.id,Math.round(e.getBoundingClientRect().left),Math.round(e.getBoundingClientRect().right),getComputedStyle(e).fontSize]))`));
  ok(r.dl >= 0 && r.dr <= w, `${w}px dock trong màn hình (${r.dl | 0}–${r.dr | 0})`);
  ok(r.tb <= r.dt, `${w}px dock không che chữ footer (text ${r.tb | 0} / dock ${r.dt | 0})`);
  ok(errs.length === 0, `${w}px không lỗi console ${errs}`);
}
await go('/apple.html'); ok(await ev(`getComputedStyle(dock).visibility`) === 'hidden', 'dock ẩn ở hero → không nhận Tab');

// Hành trình: không tạo cuộn dọc hoặc cắt mép khi reveal/cuộn ngang.
for (const w of [320, 1440]) {
  await go('/Teo', w, 740);
  await ev(`rail.scrollIntoView({block:'center'}), new Promise(r=>setTimeout(r,100))`);
  const railState = () => ev(`(()=>{const r=rail.getBoundingClientRect();return {
    overflow:rail.scrollHeight-rail.clientHeight, top:rail.scrollTop,
    cards:[...rail.children].every(c=>{const b=c.getBoundingClientRect();return getComputedStyle(c).transform==='none' && b.top>=r.top && b.bottom<=r.bottom})
  }})()`);
  let r = await railState();
  ok(r.overflow === 0 && r.top === 0 && r.cards, w + 'px hành trình: reveal không cắt mép, không cuộn dọc');
  await ev(`rail.scrollLeft=rail.scrollWidth, rail.scrollTop=40, new Promise(r=>setTimeout(r,1500))`);
  r = await railState();
  ok(r.overflow === 0 && r.top === 0 && r.cards && await ev(`rail.scrollLeft>0`), w + 'px hành trình: cuộn ngang giữ nguyên mép trên/dưới');
}

// ---- Task 2: tiện ích, cảm ơn, gallery ----
await go('/Teo', 1280, 800);
const ics = await ev(`decodeURIComponent(icsBtn.href.split(',').slice(1).join(','))`);
ok(/DTSTART:20261114T013000Z\r\n/.test(ics) && /DTEND:20261114T043000Z\r\n/.test(ics) && ics.endsWith('END:VCALENDAR\r\n'), '.ics đúng giờ (UTC, CRLF)');
ok(ics.split('\r\n').every(l => new TextEncoder().encode(l).length <= 75), '.ics mọi dòng ≤ 75 byte');
ok(await ev(`icsBtn.hasAttribute('download')`), '.ics có thuộc tính download');
ok(await ev(`photosSec.hidden && !document.querySelector('#gallery img')`), 'không ảnh → ẩn Góc kỷ niệm, không ảnh lỗi');
ok(await ev(`!thanksSec.hidden && thanks.children.length === 3`), 'lời cảm ơn hiển thị (khách FUN)');
await cmd('Emulation.setFocusEmulationEnabled', { enabled: true });
await cmd('Browser.grantPermissions', { origin: 'http://127.0.0.1:8787', permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
await ev(`copyAddr.click(), new Promise(r=>setTimeout(r,300))`);
ok(await ev(`document.getElementById('toast').classList.contains('on') && document.getElementById('toast').textContent`) === 'Đã sao chép địa chỉ', 'sao chép địa chỉ → toast thành công');
ok((await ev(`navigator.clipboard.readText()`)).length > 5, 'clipboard có địa chỉ');
await ev(`navigator.share = undefined`); // headless không có share → nhánh fallback
const sh = await ev(`shareBtn.click(), new Promise(r=>setTimeout(()=>r(document.getElementById('toast').textContent),300))`);
ok(sh === 'Đã sao chép link thiệp' && (await ev(`navigator.clipboard.readText()`)).endsWith('/Teo'), 'chia sẻ fallback → copy URL ' + sh);
ok(errs.length === 0, 'tiện ích không lỗi console ' + errs);

await go('/BaHo?photos=1', 375, 740);
await ev(`photosSec.scrollIntoView(), new Promise(r=>setTimeout(r,800))`);
ok(await ev(`!photosSec.hidden && gallery.children.length === 3`), 'gallery: 3 ảnh tốt hiện, ảnh hỏng bị bỏ');
ok(await ev(`[...gallery.querySelectorAll('img')].every(i=>i.loading==='lazy')`), 'gallery: ảnh lazy');
ok(await ev(`photosNote.textContent.startsWith('Một vài')`), 'gallery: note FORMAL cho /BaHo');
await ev(`gallery.children[1].click()`);
ok(await ev(`viewer.open && vImg.alt==='B'`), 'click ảnh → mở viewer đúng ảnh');
await ev(`vNext.click()`); ok(await ev(`vImg.alt`) === 'C', 'nút › bỏ qua ảnh hỏng, sang ảnh C');
await ev(`vPrev.click()`); ok(await ev(`vImg.alt`) === 'B', 'nút ‹ quay lại, bỏ qua ảnh hỏng');
await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await new Promise(r => setTimeout(r, 200)); ok(!(await ev(`viewer.open`)), 'Escape đóng viewer');
await ev(`gallery.children[0].click()`); await ev(`vClose.click()`); ok(!(await ev(`viewer.open`)), 'nút ✕ đóng viewer');
const r2 = await ev(`({ov:document.documentElement.scrollWidth-innerWidth, t:[...document.querySelectorAll('.tools > *, .gallery a')].filter(e=>e.getBoundingClientRect().right>innerWidth).length})`);
ok(r2.ov <= 0 && r2.t === 0, `375px gallery/tiện ích không tràn (${r2.ov}, ${r2.t})`);
ok(errs.length === 0, 'gallery không lỗi console ' + errs);

await go('/' + 'A'.repeat(120), 320, 740);
ok(await ev(`document.documentElement.scrollWidth - innerWidth`) <= 0, 'tên khách 120 ký tự không dấu cách: không tràn ở 320px');
await go('/Teo?photos=1', 375, 740);
ok(await ev(`photosNote.textContent.startsWith('Toàn ảnh')`), 'gallery: note FUN cho /Teo');
await go('/apple.html');
ok(await ev(`albumSec.hidden && !albumLink.children.length`), 'album chưa có link: ẩn, không nút giả');
const albumURL = 'https://drive.google.com/drive/folders/test-album';
for (const guest of ['BaHo', 'Teo']) {
  await go('/' + guest + '?albumTest=' + encodeURIComponent(albumURL), 320, 740);
  ok(await ev(`!albumSec.hidden && albumLink.firstElementChild.href === ${JSON.stringify(albumURL)} && albumLink.firstElementChild.target === '_blank' && albumLink.firstElementChild.rel.includes('noopener')`), guest + ': album mở đúng link Drive trong tab mới');
  await ev(`albumSec.scrollIntoView(), new Promise(r=>setTimeout(r,1300))`);
  ok(await ev(`document.documentElement.scrollWidth <= innerWidth`) && errs.length === 0, guest + ': album không tràn 320px, không lỗi console');
}
for (const url of ['javascript:alert(1)', 'link sai']) {
  await go('/apple.html?albumTest=' + encodeURIComponent(url));
  ok(await ev(`albumSec.hidden && !albumLink.children.length`) && errs.length === 0, 'album từ chối URL sai/không HTTPS: ' + url);
}
console.log(fail ? `\n${fail} FAIL` : '\nALL PASS');
chrome.kill(); process.exit(fail ? 1 : 0);
