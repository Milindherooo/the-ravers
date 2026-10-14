# RAVERS canvas production workflow

Each role below runs in its own agent context with its own brief. Roles share the checkout but edit only the files they own. They hand over through written notes, never through shared memory. The integration owner holds `build.py`, `host.js`, `capture.js`, `scripts/`, publication and the final review. Child roles never commit, push or publish.

## Order

1. **Art director** (writes no code). Reads the taste references in `vendor/taste-skill/` and the baseline renders, then writes `docs/agents/ART-DIRECTION.md`. That file holds the subject inventory, the idea sentence, the per-chapter look targets, the palette and its proportions, the motion budget, the signature move, and acceptance criteria for every role.
2. **Environment and lighting artist** owns `src/ravers/world.js` and `src/ravers/environment.js`. Hands over `docs/environment-notes.md`: geometry bounds, light rig, quality tiers and costs.
3. **Colour and post engineer** owns `src/ravers/grade.js`: tone curve, exposure, bloom, grain and the per-chapter grade keyed to progress. Hands over `docs/grade-notes.md`. Runs in parallel with the camera director, after the environment handoff.
4. **Camera director** owns `src/ravers/camera.js`. Hands over `docs/camera-notes.md`, with the chapter windows the choreographer keys to.
5. **Motion choreographer** owns `src/ravers/choreography.js`. Reads the camera and grade handoffs. Hands over `docs/choreography-notes.md`.
6. **Critic** (writes no code). Renders stills and video, scores them against the art direction and `vendor/taste-skill/references/critique.md`, and writes `docs/agents/CRITIQUE.md` with ranked fixes, each addressed to the role that owns it.
7. **Integration owner.** Routes the critique back to the owning roles (one fix round per role, in its existing context). Then builds, runs tests, renders the final stills and video, and publishes.

## Skill references per role

Two MIT skill libraries are vendored for the agents (not bundled into `dist/`): `vendor/taste-skill/` (art direction, colour, motion budget, critique) and a subset of `vendor/pro-skill/` (Three.js scroll worlds, weather, VFX, camera, performance, verification). `TS` and `PS` below abbreviate those two folders. Read the files listed for your role before acting; where they conflict with the shared contract below, the contract wins.

| Role | Read first |
| --- | --- |
| Art director | TS `SKILL.md`, `references/{colour,motion,critique,tells}.md`; PS `web-design/build-threejs-scroll-worlds/SKILL.md`, its `references/world-bible.md` and `references/kage-anatomy.md` (this hero derives from Kage); PS `web-design/build-awwwards-quality-sites` |
| Environment and lighting | ART-DIRECTION; PS `build-threejs-scroll-worlds` (geometry, materials, lighting sections) and `references/realtime-architecture.md`; PS `web-design/threejs-weather` (wet ground, puddles, rain); PS `game-development/optimize-threejs-games`, `build-mobile-threejs-games` |
| Colour and post | ART-DIRECTION; TS `references/colour.md`; PS `build-threejs-scroll-worlds` (lighting and post) and `references/quality-and-qa.md`; PS `game-development/create-game-vfx` (quality tiers) |
| Camera director | ART-DIRECTION; PS `build-threejs-scroll-worlds` (scroll mapping and camera sections), `references/scroll-conductor.js`; PS `game-development/build-game-camera-controls` |
| Motion choreographer | ART-DIRECTION; TS `references/motion.md`; PS `game-development/create-game-vfx`, `codex/optimize-web-animations` |
| Critic | ART-DIRECTION; TS `references/critique.md`, `tells.md`; PS `codex/iterate-until-verified`, `codex/audit-reference-originality` (originality against the Kage reference), `build-threejs-scroll-worlds/references/quality-and-qa.md` |
| Integration owner | PS `optimize-threejs-games`, `quality-and-qa.md`, `codex/iterate-until-verified` |

Each role may update the assertions for its own module in `tests/`. It must not weaken coverage, and it must update the numbers when it changes what they count (puddles, fog layers, samples).

## Shared contract

Modules run inside one Three.js closure in this order: world, environment, grade, camera, choreography, host, capture. `RV_CONFIG` is the timeline authority. No module creates a second RAF clock, a second renderer, or per-frame geometry or materials. Wrap lifecycle functions cooperatively (`const prev=updateWorld; updateWorld=function(dt){prev(dt); …}`) and never overwrite another role's effect. Every look must be a pure function of `RIG.smooth` (scroll progress 0–5) and `WORLD.uT.value` (the shared clock), so scrolling is reversible and capture is deterministic. Reduced motion freezes ambient movement and uses composed chapter views. P pauses ambient motion; M is opt-in audio.

The composition is canvas-only, at the user's request. Do not add headings, cards, navigation, DOM logo images or CSS overlays. The original logo (`dist/assets/ravers-original-logo.png`) keeps its artwork; it is shown as a world texture.

Mobile matters. Keep the low tier (`LOW`) cheap, bound render targets, and do not add full-screen passes without removing one.

## Seeing your work

Build a review page and render it. Never judge a change you have not looked at.

```sh
python src/ravers/build.py preview-<role>.html          # writes dist/preview-<role>.html (git-ignored)
node scripts/capture.mjs stills --page preview-<role>.html --out review/<role> [--portrait]
node scripts/capture.mjs video  --page preview-<role>.html --out review/<role>-video --fps 12 --seconds 20 --size 960x540
npm test
```

`?capture=1` replaces requestAnimationFrame with `window.__ravers.capture.step(y, dt)` and `pose(y)`, which drive the real `frame()` path. Renders use SwiftShader software GL. They are true to composition, colour and motion timing, but say nothing about GPU frame rate. Never report them as performance measurements.

## Local workflow

`npm run dev` prepares the local page and starts Vite/Motion Studio. CSS Studio is development-only. The camera and Three.js shader uniforms live in the source modules above. Motion Studio does not expose arbitrary GLSL or camera movement.

`npm run build` preserves the canonical upstream reference and builds the derivative. `npm test` verifies CPU and source constraints. GPU shader compilation and Android frame times still need checking on real devices.
