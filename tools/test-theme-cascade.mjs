import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import puppeteer from 'puppeteer';
import { FUNNEL_PERSONAS } from '../src/ui/entry-personas.js';
import { HOME_THEMES } from '../src/ui/home-theme.js';
import { readAllStyles } from './read-styles.mjs';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const tokens = await readFile(new URL('../src/theme-claude.css', import.meta.url), 'utf8');
const base = await readAllStyles();
const ui = await readFile(new URL('../src/claude-ui.css', import.meta.url), 'utf8');
const character = await readFile(new URL('../src/character-theme.css', import.meta.url), 'utf8');
assert.ok(html.indexOf('/src/styles.css') < html.indexOf('/src/theme-claude.css'), '令牌必须在基础样式之后加载');
assert.match(tokens, /html\[data-home-theme\]\s*\{/);
assert.match(tokens, /html\[data-home-theme\]\[data-theme="dark"\]\s*\{/);
const root = base.match(/:root\{([^}]*)\}/)?.[1] || '';
for (const name of ['accent', 'accent-h', 'ac', 'ac1', 'glass-border', 'glass-shadow', 'sf']) {
  assert.doesNotMatch(root, new RegExp(`--${name}\\s*:`), `${name} 不应在基础样式重复定义`);
  assert.match(tokens, new RegExp(`--${name}\\s*:`), `${name} 应由主题令牌提供`);
}
assert.doesNotMatch(ui, /:root\s*\{/);
assert.doesNotMatch(character, /html\[data-home-theme\]\s*\{/);

const baseUrl = process.env.BASE_URL || 'http://localhost:5173/index.html';
const personas = Object.entries(FUNNEL_PERSONAS);
assert.equal(personas.length, 6, '主题回归覆盖六位可选引路人');
const sharedSurfaceKeys = [
  '--c-bg', '--c-bg-2', '--c-surface', '--c-surface-2', '--c-surface-3',
  '--c-text', '--c-text-2', '--c-text-hi', '--glass-shadow',
];
const modes = {};
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
try {
  for (const mode of ['light', 'dark']) {
    const accents = new Set();
    let sharedSurface = null;
    for (const [id, persona] of personas) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 390, height: 844 });
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ mode, id }) => {
        localStorage.clear();
        localStorage.setItem('tj_theme', mode);
        localStorage.setItem('wen_funnel_persona', id);
      }, { mode, id });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(({ mode, theme }) =>
        document.documentElement.dataset.theme === mode &&
        document.documentElement.dataset.homeTheme === theme,
      {}, { mode, theme: persona.theme });

      const result = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        const keys = [
          '--trait-color', '--accent-h', '--accent-s', '--accent-l', '--c-accent', '--c-accent-text',
          '--ac', '--ac1', '--glass-border', '--glass-shadow', '--c-bg', '--c-bg-2',
          '--c-surface', '--c-surface-2', '--c-surface-3', '--c-text', '--c-text-2', '--c-text-hi',
        ];
        const values = Object.fromEntries(keys.map(key => [key, root.getPropertyValue(key).trim()]));
        const summary = document.getElementById('homeTraitSummary');
        return {
          values,
          summary: summary && {
            hidden: summary.hidden,
            label: document.getElementById('homeTraitLabel').textContent,
            description: document.getElementById('homeTraitDescription').textContent,
          },
        };
      });
      const theme = HOME_THEMES[persona.theme];
      assert.ok(theme, `${mode}/${id}: 漏斗人物映射到现存角色主题`);
      assert.equal(result.values['--trait-color'].toLowerCase(), theme.accent.toLowerCase(), `${mode}/${id}: 角色强调色与角色主题一致`);
      assert.deepEqual(result.summary, {
        hidden: false,
        label: persona.name,
        description: `${persona.title} · ${persona.focus}`,
      }, `${mode}/${id}: 当前选定的引路人说明同步可用`);

      const surface = Object.fromEntries(sharedSurfaceKeys.map(key => [key, result.values[key]]));
      if (sharedSurface) assert.deepEqual(surface, sharedSurface, `${mode}/${id}: 共享表面不随人物色相漂移`);
      else sharedSurface = surface;
      accents.add(result.values['--c-accent']);
      await context.close();
    }
    assert.ok(accents.size > 5, `${mode}: 六位引路人保留各自的主题强调色`);
    modes[mode] = sharedSurface;
  }
  assert.notEqual(modes.light['--c-bg'], modes.dark['--c-bg'], '浅深模式共享表面各自保持独立');
  assert.notEqual(modes.light['--c-text'], modes.dark['--c-text'], '浅深模式正文色各自保持独立');
  console.log('✓ 六位引路人主题映射正确；共享表面只随浅深模式变化，强调色保留人物差异');
} finally {
  await browser.close();
}
