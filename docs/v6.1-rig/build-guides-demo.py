#!/usr/bin/env python3
"""Build the self-contained six-guide rig demo (all images inlined as data URIs)."""
import base64, json, os
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))

GUIDES = [
    ('yuebai', '月白', '全能推演', '#7ea6ff', ('#060a1a', '#0a1230', '#0d1a3d')),
    ('yuchen', '玉宸', '事业', '#d9b36c', ('#06120c', '#0a1f16', '#0e2a1c')),
    ('xiyao', '夕瑶', '姻缘', '#f2a7c3', ('#160a12', '#241019', '#311425')),
    ('yanrong', '焱绒', '财富', '#f2c14e', ('#120c04', '#201505', '#2b1d07')),
    ('xuyu', '絮羽', '塔罗', '#c99ae0', ('#110818', '#1c0e28', '#261338')),
    ('xingluo', '星罗', '占星', '#a9bcf5', ('#05081a', '#0a1030', '#0d1742')),
]

TEMPLATE = r"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>六位引路人 · 2D 拆件绑骨演示</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
    background: #070b18; color: #dfe7ff; overflow: hidden;
    -webkit-user-select: none; user-select: none;
  }
  .stage {
    position: fixed; inset: 0; transition: background 0.6s;
    background:
      radial-gradient(ellipse 90% 55% at 50% 108%, rgba(120,150,220,.20), rgba(120,150,220,0) 60%),
      radial-gradient(circle at 78% 14%, rgba(240,246,255,.9) 0 30px, rgba(200,220,255,.30) 56px, rgba(200,220,255,0) 120px),
      linear-gradient(180deg, var(--bg1) 0%, var(--bg2) 55%, var(--bg3) 100%);
  }
  .stars { position: absolute; inset: 0; opacity: .7; }
  .stars i { position: absolute; border-radius: 50%; background: #dbe7ff; animation: tw 3.4s ease-in-out infinite; }
  @keyframes tw { 0%,100% { opacity: .2 } 50% { opacity: .9 } }
  .ground {
    position: absolute; left: 0; right: 0; bottom: 0; height: 15%;
    background: linear-gradient(180deg, rgba(140,170,240,.08), rgba(80,110,200,.16));
    border-top: 1px solid rgba(170,200,255,.12);
  }
  .fig-wrap {
    position: absolute; left: 50%; bottom: 4%; transform: translateX(-50%);
    filter: drop-shadow(0 18px 44px rgba(0,0,0,.55));
  }
  .figure { position: absolute; inset: 0; transform-origin: 50% 88%; will-change: transform; }
  .figure img.body { position: absolute; inset: 0; width: 100%; height: 100%; }
  .patch { position: absolute; will-change: transform, opacity; opacity: 0; transition: opacity .09s linear; }
  .patch.on { opacity: 1; }
  .mote {
    position: absolute; border-radius: 50%; pointer-events: none; mix-blend-mode: screen;
    filter: blur(2px); animation: flick 2.8s ease-in-out infinite;
  }
  @keyframes flick {
    0%,100% { transform: scale(1) translateY(0); opacity: .75; }
    30% { transform: scale(1.14) translateY(-4%); opacity: 1; }
    55% { transform: scale(.92) translateY(2%); opacity: .6; }
    75% { transform: scale(1.07) translateY(-2%); opacity: .9; }
  }
  .tabs {
    position: fixed; left: 50%; top: 16px; transform: translateX(-50%); z-index: 6;
    display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; max-width: 96vw;
  }
  .tabs button {
    font: inherit; font-size: 13.5px; letter-spacing: .1em; cursor: pointer;
    color: #c9d6f5; background: rgba(14,20,42,.66); border: 1px solid rgba(150,180,255,.25);
    padding: 8px 16px; border-radius: 999px; backdrop-filter: blur(8px); transition: all .18s;
  }
  .tabs button small { font-size: 10.5px; opacity: .65; margin-left: 4px; letter-spacing: .04em; }
  .tabs button.act { color: #fff; border-color: var(--accent); background: rgba(30,42,80,.8); box-shadow: 0 0 0 1px var(--accent) inset; }
  .panel {
    position: fixed; left: 18px; top: 76px; z-index: 5;
    background: rgba(10,16,36,.62); border: 1px solid rgba(150,180,255,.2);
    border-radius: 14px; padding: 12px 15px; backdrop-filter: blur(8px); max-width: 290px;
  }
  .panel h1 { font-size: 15px; letter-spacing: .12em; font-weight: 600; color: #eef3ff; }
  .panel p { font-size: 12px; line-height: 1.7; color: #9db1dd; margin-top: 5px; }
  .btns { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); z-index: 5; display: flex; gap: 10px; }
  .btns button {
    font: inherit; font-size: 13px; letter-spacing: .08em; cursor: pointer;
    color: #dfe7ff; background: rgba(16,26,54,.72); border: 1px solid rgba(150,180,255,.3);
    padding: 9px 18px; border-radius: 999px; backdrop-filter: blur(8px); transition: all .18s;
  }
  .btns button.act { background: #2b4a8f; border-color: var(--accent); color: #fff; }
  .params {
    position: fixed; right: 18px; top: 76px; z-index: 5; text-align: right;
    font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; line-height: 1.9; color: #8fa8d8;
    background: rgba(10,16,36,.5); border: 1px solid rgba(150,180,255,.14);
    border-radius: 12px; padding: 10px 14px; backdrop-filter: blur(8px);
  }
  .params b { color: #e6eeff; font-weight: 500; }
  .hint { position: fixed; right: 18px; bottom: 20px; z-index: 5; font-size: 12px; color: #7e93c4; }
  @media (max-width: 760px) { .panel, .params { display: none; } }
</style>
</head>
<body>
<div class="stage" id="stage">
  <div class="stars" id="stars"></div>
  <div class="ground"></div>
  <div class="fig-wrap" id="figWrap">
    <div class="figure" id="figure">
      <img class="body" id="bodyImg" alt="">
      <img class="patch" id="p-blink" alt="">
      <img class="patch" id="p-talk" alt="">
      <div class="mote" id="mote1"></div>
      <div class="mote" id="mote2"></div>
    </div>
  </div>
</div>

<div class="tabs" id="tabs"></div>

<div class="panel">
  <h1 id="panelTitle">月白 · 全能推演</h1>
  <p>六位引路人拆件绑骨版：身体层自带脸，五官补丁（闭眼/张口）按实测锚点标定对位。呼吸、悬浮、跟随、眨眼、口型全部参数驱动。</p>
</div>

<div class="params" id="params"></div>

<div class="btns">
  <button data-mode="idle" class="act">常态</button>
  <button data-mode="talk">说话</button>
  <button data-mode="listen">聆听 · 闭眼</button>
</div>
<div class="hint">移动鼠标 / 手指 — 他会微微跟随</div>

<script>
const GUIDES = __GUIDES_JSON__;
const ORDER = Object.keys(GUIDES);
const stage = document.getElementById('stage');
const figWrap = document.getElementById('figWrap');
const figure = document.getElementById('figure');
const bodyImg = document.getElementById('bodyImg');
const pBlink = document.getElementById('p-blink');
const pTalk = document.getElementById('p-talk');
const motes = [document.getElementById('mote1'), document.getElementById('mote2')];
const paramsEl = document.getElementById('params');
const tabsEl = document.getElementById('tabs');

(() => {
  let html = '';
  for (let i = 0; i < 90; i++) {
    const s = (Math.random() * 1.8 + .7).toFixed(1);
    html += `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 60).toFixed(1)}%;width:${s}px;height:${s}px;animation-delay:${(-Math.random() * 3.4).toFixed(1)}s"></i>`;
  }
  document.getElementById('stars').innerHTML = html;
})();

let cur = 'yuebai', mode = 'idle';
let px = 0, py = 0, hx = 0, hy = 0;
let talkFlip = false, lastTalk = 0;

function placePatch(img, p) {
  img.style.left = (p.left * 100) + '%';
  img.style.top = (p.top * 100) + '%';
  img.style.width = (p.width * 100) + '%';
}
function setGuide(key) {
  cur = key;
  const g = GUIDES[key];
  document.documentElement.style.setProperty('--accent', g.accent);
  stage.style.setProperty('--bg1', g.bgs[0]);
  stage.style.setProperty('--bg2', g.bgs[1]);
  stage.style.setProperty('--bg3', g.bgs[2]);
  document.getElementById('panelTitle').textContent = g.name + ' · ' + g.spec;
  bodyImg.src = g.body;
  pBlink.src = g.patches.blink.src;
  pTalk.src = g.patches.talk.src;
  placePatch(pBlink, g.patches.blink.place);
  placePatch(pTalk, g.patches.talk.place);
  const baseH = Math.min(innerHeight * 0.84, innerWidth * 1.7);
  const h = baseH * g.hFactor;
  figWrap.style.height = h + 'px';
  figWrap.style.aspectRatio = String(g.aspect);
  const moteCss = `background: radial-gradient(circle, ${g.accent}ee 0%, ${g.accent}88 34%, ${g.accent}00 70%);`;
  motes[0].style.cssText = `left:5%; top:56%; width:10%; aspect-ratio:1; ${moteCss}`;
  motes[1].style.cssText = `left:85%; top:64%; width:7.5%; aspect-ratio:1; animation-delay:-1.4s; ${moteCss}`;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('act', b.dataset.g === key));
  pTalk.classList.remove('on');
  if (mode === 'listen') pBlink.classList.add('on'); else pBlink.classList.remove('on');
}
tabsEl.innerHTML = ORDER.map(k => `<button data-g="${k}">${GUIDES[k].name}<small>${GUIDES[k].spec}</small></button>`).join('');
tabsEl.querySelectorAll('button').forEach(b => b.addEventListener('click', () => setGuide(b.dataset.g)));
addEventListener('resize', () => setGuide(cur));
addEventListener('pointermove', e => {
  px = (e.clientX / innerWidth) * 2 - 1;
  py = (e.clientY / innerHeight) * 2 - 1;
});
function scheduleBlink() {
  setTimeout(() => {
    if (mode === 'idle') {
      pBlink.classList.add('on');
      setTimeout(() => { if (mode === 'idle') pBlink.classList.remove('on'); }, 150);
    }
    scheduleBlink();
  }, 2600 + Math.random() * 3200);
}
scheduleBlink();
document.querySelectorAll('.btns button').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.btns button').forEach(x => x.classList.remove('act'));
    b.classList.add('act');
    mode = b.dataset.mode;
    pTalk.classList.remove('on');
    if (mode === 'listen') pBlink.classList.add('on'); else pBlink.classList.remove('on');
  });
});
(() => {
  const q = new URLSearchParams(location.search);
  const g = q.get('g'), m = q.get('mode');
  if (g && GUIDES[g]) setGuide(g); else setGuide('yuebai');
  if (m === 'talk' || m === 'listen') {
    document.querySelector(`.btns button[data-mode="${m}"]`)?.click();
    if (m === 'talk') pTalk.classList.add('on');
  }
})();
function frame(t) {
  const s = t / 1000;
  const breath = Math.sin(s * (Math.PI * 2 / 3.4));
  const bob = Math.sin(s * (Math.PI * 2 / 6.2));
  hx += (px - hx) * .045; hy += (py - hy) * .045;
  figure.style.transform =
    `translateY(${(bob * 7).toFixed(2)}px) rotate(${(hx * .8).toFixed(2)}deg) scale(1, ${(1 + breath * .0045).toFixed(5)})`;
  const faceShift = `translate(${(hx * 3.5).toFixed(2)}px, ${(hy * 2.2 + breath * .5).toFixed(2)}px)`;
  pBlink.style.transform = faceShift;
  pTalk.style.transform = faceShift;
  if (mode === 'talk' && t - lastTalk > 165) {
    lastTalk = t; talkFlip = !talkFlip;
    pTalk.classList.toggle('on', talkFlip);
  }
  paramsEl.innerHTML =
    `ParamAngleX <b>${(hx * 30).toFixed(1)}</b><br>` +
    `ParamAngleY <b>${(hy * 22).toFixed(1)}</b><br>` +
    `ParamBreath <b>${((breath + 1) / 2).toFixed(2)}</b><br>` +
    `Guide <b>${GUIDES[cur].name}</b><br>` +
    `Blink <b>${pBlink.classList.contains('on') ? 1 : 0}</b> · Mouth <b>${pTalk.classList.contains('on') ? 'open' : 'shut'}</b>`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
</script>
</body>
</html>
"""

def datauri(path):
    with open(path, 'rb') as f:
        return 'data:image/webp;base64,' + base64.b64encode(f.read()).decode()

data = {}
ref_frac = None
for key, name, spec, accent, bgs in GUIDES:
    folder = os.path.join(ROOT, key)
    man = json.load(open(os.path.join(folder, f'{key}-rig-manifest.json')))
    body_file = os.path.join(folder, man['body']['file'])
    bw, bh = man['body']['size']
    bbox = Image.open(body_file).getchannel('A').getbbox()
    frac = (bbox[3] - bbox[1]) / bh
    if ref_frac is None:
        ref_frac = frac
    patches = {}
    for kind in ('blink', 'talk'):
        p = man['patches'][kind]
        patches[kind] = {'src': datauri(os.path.join(folder, p['file'])), 'place': p['place']}
    data[key] = {
        'name': name, 'spec': spec, 'accent': accent, 'bgs': list(bgs),
        'body': datauri(body_file), 'aspect': bw / bh,
        'hFactor': round(ref_frac / frac, 3),
        'patches': patches,
    }
    print(key, 'frac', round(frac, 3), 'hFactor', data[key]['hFactor'])

html = TEMPLATE.replace('__GUIDES_JSON__', json.dumps(data, ensure_ascii=False))
out = os.path.join(ROOT, 'guides-rig-demo.html')
open(out, 'w', encoding='utf-8').write(html)
print('written', out, 'kb:', len(html) // 1024)
