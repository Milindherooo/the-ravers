from pathlib import Path
import re,json,hashlib,shutil,sys
root=Path(__file__).resolve().parents[2];up=root/'vendor/kage/upstream';bundle=json.loads((up/'bundle.json').read_text())
# Never accept a changed baseline or binary.
for f in bundle['files']+bundle['assets']:
 p=up/f['path'];assert p.exists(),f['path'];assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256'],f['path']
reference=root/'dist/landing-pages';shutil.copytree(up/'public/landing-pages',reference,dirs_exist_ok=True)
vendor=root/'vendor/kage';vendor.mkdir(parents=True,exist_ok=True)
shutil.copy2(up/'bundle.json',vendor/'registered-source.json');shutil.copytree(up/'src',vendor/'src',dirs_exist_ok=True)
s=(reference/'kage.html').read_text();s=s.replace('<title>Kage — Where stillness reveals the unseen</title>','<title>RAVERS.IN / The night starts here.</title>');s=re.sub(r'<meta name="description"[^>]+>','<meta name="description" content="RAVERS.IN. Independent techno culture from India. Step into a living warehouse, from 23:00 to first light.">',s)
s=s.replace('<link rel="stylesheet" href="secret-pathways-assets/fonts.css">','<link rel="preload" href="/assets/font-0.ttf" as="font" type="font/ttf" crossorigin>')
s=re.sub(r"url\('secret-pathways-assets/[^']+'\)",'linear-gradient(#131310,#090909)',s)
s=re.sub(r'<style[^>]*>[\s\S]*?</style>','',s)
s=s.replace('</head>','<script type="module" src="/assets/ravers-ui.js"></script><style>'+ (root/'src/ravers/overrides.css').read_text()+'</style></head>')
a=s.index('<body');b=s.index('<script src="secret-pathways-assets/three.min.js">',a)
s=s[:a]+(root/'src/ravers/body.html').read_text()+'\n'+s[b:];s=s.replace('src="secret-pathways-assets/three.min.js"','src="/landing-pages/secret-pathways-assets/three.min.js"')
s=s.replace('_p.z += io * 5.6; _p.y += io * 0.65; fov += io * 8;', '_p.z += io * .45;')
s=s.replace('const REDUCE =','let REDUCE =').replace('else if (!running)', 'else if (!running && !RV.contextLost)')
s=s.replace("const word = 'KAGE'", "const word = 'RAVERS.IN'").replace('const SZ = 320, TRACK = .40','const SZ = 320, TRACK = .015')
s=s.replace("'rgb(226,236,229)'","'rgb(232,227,216)'").replace("'rgb(198,214,203)'","'rgb(209,203,190)'").replace("'rgb(150,170,157)'","'rgb(157,152,140)'")
s=s.replace("const names = ['The Hidden Gate', 'The Sanmon', 'Still Gardens', 'Sacred Craft', 'Afterlight', 'Colophon'];","const names = ['Outside', 'The space', 'The culture', 'The sound', 'First light', 'RAVERS.IN'];")
# Brand-specific grade removes cyan shadow tint; the authored multipass pipeline remains.
s=s.replace('vec3(0.74,1.03,1.11)','vec3(1.0,1.0,1.0)').replace('vec3(1.035,0.995,0.968)','vec3(1.0,1.0,1.0)')
s=s.replace("uCA: { value: 1 }","uCA: { value: 0 }").replace("uGrain: { value: .020 }","uGrain: { value: .007 }").replace("uBloom: { value: .34 }","uBloom: { value: .16 }").replace("uExp: { value: .62 }","uExp: { value: .95 }")
s=s.replace("const DPR_CAP      = qn('dpr', LOW ? 1.4 : 1.8);","const DPR_CAP      = qn('dpr', LOW ? 1.2 : 1.65);")
a=s.index('const JOBS = [');b=s.index('\nfunction boot()',a)
jobs="""const JOBS = [
 ['Setting the type',()=>document.fonts.ready],
 ['Powering the room',()=>{initGL();WORLD.uT={value:0};buildRig();buildLights();}],
 ['Building the loading bay',()=>buildShell()],
 ['Mounting the original logo',()=>rvLogo()],
 ['Installing the sound system',()=>rvSpeakers()],
 ['Hanging the details',()=>rvObjects()],
 ['Setting the atmosphere',()=>rvAtmosphere()],
 ['Opening the room',()=>{initPost();buildCards();rvWire();WORD.glyphs.forEach(m=>m.layers.set(2));layoutWord();measure();if(WANT_SHADOW){WORLD.key.shadow.autoUpdate=false;WORLD.key.shadow.needsUpdate=true;}}]
];
"""
s=s[:a]+'\n'.join((root/'src/ravers'/name).read_text() for name in ['world.js','environment.js','grade.js','camera.js','choreography.js','host.js','capture.js'])+'\n'+jobs+s[b:]
# Any failed construction job keeps the readable fallback; don't call a partial scene complete.
s=s.replace('if (i <= 1) return fallback(err);','return fallback(err);')
s=s.replace("window.__kage = window.__secret = { RIG:","window.__ravers = window.__kage = window.__secret = { RIG:")
# A paused secondary view must repaint when focus changes, and after scrolling into view.
s=s.replace("c.userData.want=1);","{c.userData.want=1;RV.dirty=true;});").replace("c.userData.want=0);","{c.userData.want=0;RV.dirty=true;});")
s=s.replace("if (cardAlpha(C.el) < .995) continue;", "if (cardAlpha(C.el) < .995 || C.el.closest('.split-body[aria-hidden=\"true\"]')) continue;")
# `build.py preview-<role>.html` writes a review page beside index.html and leaves provenance alone.
out=sys.argv[1] if len(sys.argv)>1 else 'index.html';assert re.fullmatch(r'(index|preview-[a-z0-9-]+)\.html',out),out
(root/'dist'/out).write_text(s)
if out!='index.html':print('Built review page dist/'+out);sys.exit(0)
(root/'vendor/kage/provenance.json').write_text(json.dumps({'referenceSha256':hashlib.sha256((reference/'kage.html').read_bytes()).hexdigest(),'adaptedSha256':hashlib.sha256(s.encode()).hexdigest(),'source':'https://threeui.com/source-code/kage-landing-page.json','transportRecovery':['Removed injected image constructor shim','Restored manifest asset paths and removed injected crossorigin attributes','Re-embedded verified font bytes into original data URLs'],'changes':['Original warehouse geometry, scene props, camera stops and brand copy','Anton and Archivo typography','Neutral grade, lower bloom, no chromatic aberration','Canvas-only viewport with transparent chapter anchors; DOM UI and live cards retired','Shared bounded planar puddle reflections and instanced environment details','Safe Hermite/quaternion camera path with separate portrait composition','Original supplied logo shader choreography and keyboard-only ambient controls','Leaves, temple, moon, cursor particles and plant cutouts not instantiated','Opt-in synthesized audio, pause control, context-loss fallback and disposal']},indent=2))
print('Verified all',len(bundle['files'])+len(bundle['assets']),'registered files and assets; built RAVERS derivative.')
