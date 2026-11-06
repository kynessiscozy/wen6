/* ============================================================
   把 src/product-copy.js 的唯一文案同步到三个出口：
     · index.html          关于 / 免责声明弹窗
     · public/funnel.html  关于 / 免责声明弹窗 + 使用指南数据
     · README.md           使用指南 / 关于问问大师 / 免责声明

   用法：
     npm run sync:copy          生成
     node tools/sync-product-copy.mjs --check   只校验，不写文件
   ============================================================ */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PRODUCT, GUIDE, GUIDE_TABS, GUIDE_SUBTITLE, ABOUT, DISCLAIMER } from '../src/product-copy.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CHECK = process.argv.includes('--check');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* 文案里用 **强调** 作跨平台标记：HTML 转 <b>，Markdown 原样保留。 */
const inlineHtml = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

function aboutHtml() {
  const L = [
    `    <p class="about-kicker">${esc(ABOUT.kicker)}</p>`,
    `    <h2 id="aboutTitle">${esc(ABOUT.title)}</h2>`,
    `    <p class="about-lead">${esc(ABOUT.lead)}</p>`,
  ];
  for (const s of ABOUT.sections) {
    L.push('    <div class="about-section">');
    L.push(`      <h3>${esc(s.title)}</h3>`);
    for (const p of s.paragraphs) L.push(`      <p>${esc(p)}</p>`);
    L.push('    </div>');
  }
  L.push(`    <div class="about-note"><b>${esc(ABOUT.note.title)}</b><p>${esc(ABOUT.note.text)}</p></div>`);
  return L.join('\n');
}

function disclaimerHtml() {
  const L = [`      <p style="margin-bottom:12px">${inlineHtml(DISCLAIMER.intro)}</p>`];
  for (const sec of DISCLAIMER.sections) {
    L.push('');
    L.push(`      <div style="font-weight:700;font-size:1.05em;margin:16px 0 8px;color:var(--c-text-hi)">${esc(sec.title)}</div>`);
    for (const b of sec.blocks) {
      if (b.type === 'p') L.push(`      <p style="margin-bottom:10px">${inlineHtml(b.text)}</p>`);
      if (b.type === 'list') {
        L.push('      <ul style="padding-left:18px;margin-bottom:10px">');
        for (const item of b.items) L.push(`        <li style="margin-bottom:4px">${esc(item)}</li>`);
        L.push('      </ul>');
      }
    }
  }
  L.push('');
  L.push('      <div style="margin-top:4px;padding:12px 14px;border-radius:12px;background:var(--c-surface-3);border:1px solid var(--c-border);font-size:.9em;color:var(--c-text-2);line-height:1.7">');
  L.push(`        <b style="color:var(--c-text-hi)">${esc(DISCLAIMER.footer.lead)}</b>${esc(DISCLAIMER.footer.text)}`);
  L.push('      </div>');
  return L.join('\n');
}

/* funnel.html 的渲染函数沿用短键名 k/t/d，这里做一次字段映射。 */
function funnelGuideJs() {
  const data = {};
  for (const [key, sec] of Object.entries(GUIDE)) {
    data[key] = { k: sec.kicker, t: sec.title, d: sec.desc };
    if (sec.steps) data[key].steps = sec.steps;
    if (sec.terms) data[key].terms = sec.terms;
    if (sec.faqs) data[key].faqs = sec.faqs;
  }
  return 'var FM_GUIDE=' + JSON.stringify(data, null, 2) + ';';
}

function readmeMd() {
  const L = [
    '## 使用指南',
    '',
    `> 以下「使用指南 / 关于问问大师 / 免责声明」三节与应用内弹窗同源，均由 \`${PRODUCT.source}\` 统一生成；改文案请先改数据源，再执行 \`npm run sync:copy\`。应用内可在菜单底部打开同样内容。`,
    '',
  ];
  for (const [key, label] of GUIDE_TABS) {
    const sec = GUIDE[key];
    L.push(`### ${label} · ${sec.title}`, '');
    L.push(sec.desc, '');
    if (sec.steps) sec.steps.forEach(([t, d], i) => L.push(`${i + 1}. **${t}**：${d}`));
    if (sec.terms) {
      L.push('| 术语 | 体系 | 解释 |', '| --- | --- | --- |');
      sec.terms.forEach(([n, s, d]) => L.push(`| ${n} | ${s} | ${d} |`));
    }
    if (sec.faqs) sec.faqs.forEach(([q, a]) => L.push(`- **${q}** ${a}`));
    L.push('');
  }
  L.push('## 关于问问大师', '', ABOUT.lead, '');
  for (const s of ABOUT.sections) {
    L.push(`### ${s.title}`, '');
    for (const p of s.paragraphs) L.push(p, '');
  }
  L.push(`> **${ABOUT.note.title}**：${ABOUT.note.text}`, '');
  L.push('## 免责声明', '', DISCLAIMER.intro, '');
  for (const sec of DISCLAIMER.sections) {
    L.push(`### ${sec.title}`, '');
    for (const b of sec.blocks) {
      if (b.type === 'p') L.push(b.text, '');
      if (b.type === 'list') {
        for (const item of b.items) L.push(`- ${item}`);
        L.push('');
      }
    }
  }
  L.push(`> **${DISCLAIMER.footer.lead}**${DISCLAIMER.footer.text}`, '');
  return L.join('\n').trimEnd();
}

const BLOCKS = {
  ABOUT: ['<!-- PRODUCT:ABOUT:BEGIN -->', '<!-- PRODUCT:ABOUT:END -->'],
  DISCLAIMER: ['<!-- PRODUCT:DISCLAIMER:BEGIN -->', '<!-- PRODUCT:DISCLAIMER:END -->'],
  GUIDE: ['/* PRODUCT:GUIDE:BEGIN */', '/* PRODUCT:GUIDE:END */'],
  README: ['<!-- PRODUCT:README:BEGIN -->', '<!-- PRODUCT:README:END -->'],
};

function fill(text, name, content) {
  const [begin, end] = BLOCKS[name];
  const start = text.indexOf(begin);
  const stop = text.indexOf(end);
  if (start < 0 || stop < 0 || stop < start) throw new Error(`缺少 ${name} 区块标记`);
  const head = text.slice(0, start + begin.length);
  const tail = text.slice(stop);
  return head + '\n' + content + '\n' + tail;
}

const targets = [
  ['index.html', [['ABOUT', aboutHtml()], ['DISCLAIMER', disclaimerHtml()]]],
  ['public/funnel.html', [['ABOUT', aboutHtml()], ['DISCLAIMER', disclaimerHtml()], ['GUIDE', funnelGuideJs()]]],
  ['README.md', [['README', readmeMd()]]],
];

let changed = 0;
for (const [file, blocks] of targets) {
  const path = ROOT + file;
  const original = await readFile(path, 'utf8');
  let next = original;
  for (const [name, content] of blocks) next = fill(next, name, content);
  if (next !== original) {
    changed++;
    if (!CHECK) await writeFile(path, next, 'utf8');
    console.log(`${CHECK ? '✗ 不同步' : '✓ 已同步'}：${file}`);
  } else {
    console.log(`✓ 已一致：${file}`);
  }
}

/* 版本号与过时口径的全局一致性校验（只查对外文案，不改历史文档）。 */
const checks = [
  ['index.html', ['wenV6'], ['V5.0', '同行特质']],
  ['public/funnel.html', ['wenV6', GUIDE_SUBTITLE], ['V5.0', '同行特质']],
  ['README.md', ['wenV6'], ['V5.0']],
  ['src/product-copy.js', ['wenV6'], ['V5.0']],
  ['src/onboarding.js', ['GUIDE_SUBTITLE'], []],
  ['src/share/long-report.js', ['PRODUCT.version'], ['V5.0']],
  ['src/share/poster.js', [], ['同行特质']],
  ['src/ai/openrouter.js', [], ['wenV2']],
];
const problems = [];
for (const [file, required, forbidden] of checks) {
  const text = await readFile(ROOT + file, 'utf8');
  for (const s of required) if (!text.includes(s)) problems.push(`${file} 缺少「${s}」`);
  for (const s of forbidden) if (text.includes(s)) problems.push(`${file} 仍含「${s}」`);
}
const pkg = JSON.parse(await readFile(ROOT + 'package.json', 'utf8'));
if (pkg.productVersion !== PRODUCT.version) problems.push(`package.json productVersion 应为 ${PRODUCT.version}`);
if (problems.length) {
  console.error('\n版本/口径校验未通过：\n' + problems.map(p => '  · ' + p).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`✓ 版本号与口径校验通过（${PRODUCT.label}）`);
}
if (CHECK && changed) process.exitCode = 1;
if (!CHECK) console.log(`\n完成：${changed} 个文件已更新，数据源 ${PRODUCT.source}`);
