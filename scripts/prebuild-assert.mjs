import path from 'node:path';

function assertResolve(name, paths) {
  try {
    require.resolve(name, { paths });
    console.log('✅', name, 'resolved from', paths?.[0] || 'cwd');
  } catch (e) {
    console.error('❌ Cannot resolve', name, 'from', paths?.[0] || 'cwd');
    process.exit(1);
  }
}

assertResolve('daisyui');
assertResolve('tailwindcss');
assertResolve('postcss');
assertResolve('autoprefixer');

const clientDir = path.resolve(__dirname, 'client');
assertResolve('daisyui', [clientDir]);
assertResolve('tailwindcss', [clientDir]);
assertResolve('postcss', [clientDir]);
assertResolve('autoprefixer', [clientDir]);
