import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['scripts/build-ui.mjs'],{stdio:'inherit'});
execFileSync('python',['src/ravers/build.py'],{stdio:'inherit'});
const html=readFileSync('dist/index.html','utf8').replace('src="/assets/ravers-ui.js"','src="/src/ui/main.tsx"');
writeFileSync('index.html',html);
if(!existsSync('.env.local'))writeFileSync('.env.local','MOTION_STUDIO_AGENT_PROVIDER=codex\n');
console.log('Prepared local editor page. Motion Studio starts with Vite.');
