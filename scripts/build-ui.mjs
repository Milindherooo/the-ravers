import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
await build({entryPoints:['src/ui/main.tsx'],bundle:true,minify:true,format:'esm',target:['es2022'],outfile:'dist/assets/ravers-ui.js',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
execFileSync(process.execPath,['node_modules/@tailwindcss/cli/dist/index.mjs','-i','src/ui/tailwind.css','-o','dist/assets/ravers-ui.css','--minify'],{stdio:'inherit'});
console.log('Built canvas-only entry; development editors excluded from production.');
