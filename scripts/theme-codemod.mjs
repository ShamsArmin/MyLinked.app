import { globby } from 'globby';
import fs from 'fs/promises';

const replacements = [
  [/bg-white/g, 'bg-base-100'],
  [/\bbg-(gray|slate|zinc)-50\b/g, 'bg-base-100'],
  [/\bbg-(gray|slate|zinc)-(100|200)\b/g, 'bg-base-200'],
  [/\btext-(black|gray-900|slate-900|zinc-900|gray-700)\b/g, 'text-base-content'],
  [/\bborder-(gray|zinc)-(100|200|300)\b/g, 'border-base-300'],
];

const files = await globby([
  'client/src/**/*.{tsx,jsx,ts,js,html}',
  'client/index.html',
]);
for (const f of files) {
  let s = await fs.readFile(f, 'utf8');
  const before = s;
  for (const [re, to] of replacements) s = s.replace(re, to);
  if (s !== before) await fs.writeFile(f, s);
}
console.log('Codemod completed.');
