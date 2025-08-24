import { globby } from 'globby';
import fs from 'fs/promises';

const files = await globby(['client/src/**/*.{css,scss,pcss}', '!node_modules/**']);
const patterns = [
  /@apply\s+[^;]*\bbg-base-\d{3}\b[^;]*;/g,
  /@apply\s+[^;]*\btext-base-content\b[^;]*;/g,
  /@apply\s+[^;]*\bborder-base-\d{3}\b[^;]*;/g,
  /@apply\s+[^;]*\bbtn[^\s;]*\b[^;]*;/g,         // avoid applying daisyUI components in CSS
];

for (const f of files) {
  let s = await fs.readFile(f, 'utf8');
  let before = s;
  for (const re of patterns) s = s.replace(re, ''); // drop the apply; use utilities in markup instead
  if (s !== before) {
    await fs.writeFile(f, s);
    console.log('cleaned:', f);
  }
}
console.log('Done removing @apply of base tokens.');
