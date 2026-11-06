import { readdirSync, readFileSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';

/* 样式已按功能拆到 src/styles/ 下，测试需要的是「层叠后的完整样式」，
   这里按文件名排序拼接，等价于 src/styles.css 的 @import 顺序。 */
const DIR = new URL('../src/styles/', import.meta.url);

export function readAllStylesSync() {
  const names = readdirSync(DIR).filter((n) => n.endsWith('.css')).sort();
  return names.map((n) => readFileSync(new URL(n, DIR), 'utf8')).join('\n');
}

export async function readAllStyles() {
  const names = (await readdir(DIR)).filter((n) => n.endsWith('.css')).sort();
  const parts = await Promise.all(names.map((n) => readFile(new URL(n, DIR), 'utf8')));
  return parts.join('\n');
}
