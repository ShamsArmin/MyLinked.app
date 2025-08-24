import { globby } from 'globby';
import fs from 'fs/promises';

const files = await globby(['client/src/**/*.{tsx,jsx,ts,js,html}', 'src/**/*.{tsx,jsx,ts,js,html}']);

for (const f of files) {
  let s = await fs.readFile(f, 'utf8');
  let before = s;

  // Remove Tailwind dark: utilities safely (basic)
  s = s.replace(/\sdark:[\w-:\/\\]+/g, '');

  // Remove nested data-theme attributes (keep previews by renaming to data-theme-preview)
  s = s.replace(/data-theme=/g, 'data-theme-removed=');
  s = s.replace(/data-theme-removed-preview=/g, 'data-theme-preview=');

  if (s !== before) {
    await fs.writeFile(f, s);
  }
}

console.log('Stripped dark: utilities and nested data-theme attributes.');
