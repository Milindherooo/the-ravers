import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {motionStudio} from 'motion-studio';
const source=readFileSync('src/ui/card-split-accordian.tsx','utf8');
const plugin=motionStudio();
assert.equal(plugin.apply,'serve');
const instrumented=plugin.transform(source,process.cwd()+'/src/ui/card-split-accordian.tsx');
assert(instrumented?.code);
const tracks=[...instrumented.code.matchAll(/data-mtl-id=/g)];
assert(tracks.length>=3,'archived component animation discovery');
const html=readFileSync('dist/index.html','utf8');
const js=readFileSync('dist/assets/ravers-ui.js','utf8');
for(const marker of ['data-mtl-id','startStudio','cssstudio','motion-studio','localhost:5200']){
 assert(!html.includes(marker),'Production HTML contains editor: '+marker);
 assert(!js.includes(marker),'Production JS contains editor: '+marker);
}
const vite=readFileSync('vite.config.mjs','utf8');assert(vite.indexOf('motionStudio(),react()')!==-1);
console.log(`PASS: ${tracks.length} archived Motion element tracks remain discoverable; canvas entry ships no Studio boot or instrumentation.`);
