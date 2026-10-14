# Environment and lighting: handoff

Owner: Environment & Lighting (`src/ravers/world.js`, `src/ravers/environment.js`).
Readers: Grade, Camera, Choreography, Critic, Integration.
Supersedes the previous version of this file. ART-DIRECTION.md §3, §4 and §6 remain the brief.

## 1. Read this first

- **`npm test` reads `dist/index.html`, which still holds the old build.** The environment assertions in `tests/ravers-source.test.cjs` now describe the new world, so a plain `npm test` stops at a clear message (`dist/index.html predates the environment rebuild …`). Until the integration owner rebuilds `index.html`, run the suite against a review build of the current sources:
  `python src/ravers/build.py preview-environment.html && RV_PAGE=dist/preview-environment.html npm test` (all five suites pass).
  I did not write `dist/index.html`, because `dist/` is not mine.
- **Base intensities are steady and recomputed every frame. The beat is gone from world.js.** Multiply the bases, don't accumulate on them (§4).
- **`uSpill` and `uDawnSpill` are driven provisionally in `rvEnvUpdate`** (marked `PROVISIONAL` in `environment.js`). Choreography overwrites them in its later `updateWorld` wrapper (§4).
- **The grade will set the exposure that the HDR authoring was solved for** (§9). Colours that must display as the bible's hex values (the sky, fog, practicals) are solved through the inverse of the comp pass's ACES fit at those exposures.

## 2. What changed

**Light.**
- The frontal moonlit key, the 0.42 hemisphere, both red point lights, the fill point and the dawn directional are retired.
- Two realtime lights remain:
  - `WORLD.key`, the single shadowed directional. It is 1024² on high, with no shadows on LOW.
  - `RV.hemi`, the skyglow hemisphere at .07.
- Every other source is an analytic term in one shared material hook, fed through Three's own `RE_Direct`. Wet ground therefore gets correct specular from them without using light slots.
- The key is the yard sodium at night. In the shader it becomes a point-like pool, with direction from the sodium head and 1/(1+(d/6)²) falloff. Over 3.55–4.10 it rotates into the low sun.

**Facade.**
- Cast-concrete piers, dado and coping, with black water streaks 0.3–1.5 m under every ledge and a dark splash band at 0–0.4 m (both in the shader, so they are causal and per-ledge).
- Trapezoidal galvalume cladding, as real ribs at 250 mm pitch. Rust appears only under fastener rows and in the bottom 30 cm.
- Painted-steel door leaves: #141515 with primer wear at the edges, the handle and the kick zone.
- An aluminium light box behind the supplied logo artwork. The artwork is unchanged.
- Sconces on the door piers: the left one is lit, the right one is dead.
- Downpipes, conduit and meter box, dark-glass service windows, the vent.
- A yard sodium pole on the left of the frame.
- The three house-rule wheatpastes on the left dado: torn corners, bubbles, wet bottom edge, single-sided.

**Sky and estate.**
- `dawnPlane` is gone. One back-faced sphere is the sky (1 draw). It carries the night skyglow (#120f0c zenith to #2e2318 horizon), the dawn gradient (#f2b77a toward the sun, #cdb9a2, #8c9aa8 zenith), haze below the horizon and a 1.2° sun disc with a tight corona.
- The same `rvSky()` GLSL feeds the puddles and every material's specular environment term, so wet ground always holds the current sky.
- Across the road (z +21.5 to +62) one vertex-coloured merged mesh (1 draw) holds:
  - the compound wall with piers, coping and a gate;
  - five sheds of 4–7.4 m with shutters, louvres and eaves;
  - a saw-tooth roof;
  - two black Sintex tanks on stands, one directly under the sun from the doorway;
  - three turbo ventilators (they spin in the vertex shader at .35 rev/s from `WORLD.uT`);
  - a neem;
  - three sagging cables from the road pole.
- At dawn the estate takes aerial perspective toward the haze colour.

**Interior.**
- Removed: the banners, the SAME SOUND sign, the door signs (R / 01, AFTER HOURS), the POWER print, every eyebrow, rule and caption, and all `DoubleSide` prints.
- The cabinets are black tolex (#0f0f0f) with recessed baffles and aluminium edges. The 16 drivers are three `InstancedMesh`es (cone, cap and surround: 3 draws, down from 48).
- The flight-case booth has extrusions, ball corners and latches. It holds two turntables (453×353 mm, 332 mm platters) and a two-channel mixer, plus a gooseneck lamp.
- A white spray-stencil "140", 0.45 m tall, sits on the case front.
- WAY OUT hangs above the door, facing into the hall.
- A closed roller shutter on the back wall carries the red wash.
- The translucent roof sheets are dark at night and pale first at dawn.

**Red confined.**
- At night, red exists only in the seam and under-door line, the floor wedge (`uSpill`), the doorway surfaces within 6 m, the booth tube, the back wash, and their wet reflections.
- The back wash is a row of wash fixtures behind the stacks, aimed at the back wall, with a 16 m range. The middle of the hall stays dark: at 2, dark is 92–94%.
- All red multiplies `uRed`, which fades over 3.55–4.10.

**Floor.**
- Trimix (#57544f dry) on a 3.6 m slab grid, with darker saw cuts, power-trowel arcs, and a roughness map that runs from 0.86 on the slab to 1.0 in the cuts.
- Outside, the apron is wet, from #2a2927 to roughness .2. It is drier under the canopy, with a drip line at the canopy lip and a dark road with kerbs.
- Inside, a polished lane runs down the centre to the booth.
- Wet areas take the planar capture when it is live, a 5-tap vertical smear. Elsewhere they take the analytic sky, an analytic mirror of the back wall and tube, and the seam streak.

**Puddles.**
- 12 sites in 1 draw, each a soft-edged merged shape: the drip line, the wedge, the kerb, and two roof leaks inside.
- The fallback (LOW, coarse pointers, low adaptive scale) is the analytic current sky plus the wedge and the seam, so a puddle can never be a black blob.
- Two drip rings (period 1.6 s, growing to 25 cm) sit on the drip-line puddles. They are off on LOW.

**Fog.**
- FogExp2 colour and density are a pure function of progress:
  - exterior night #15100b at .010;
  - hall #060606 at .014 (blend in over 1.15–1.75, out over 3.7–4.3);
  - dawn haze #b8a690 from .006 down to .004 (4.35–5).
- The vent steam takes the colour of the light it hangs in.

**Cleanup.**
- The old haze cards and the additive seam streak are deleted, not hidden.
- Static unit boxes are batched into instanced groups.
- The planar capture renders large forms and emitters only. Detail meshes sit on layer 3: the camera sees them, the mirror does not.
- `rvEnvReflection` no longer allocates per capture.

## 3. Light rig (`RV_RIG` in world.js, `RV.rig`)

Positions are world metres. Colours are sRGB display hex. "Base" is the steady per-frame value in `RV.environment.base`.

| Name | Kind | Position / extent | Colour | Base | Window / gating |
|---|---|---|---|---|---|
| `key` (`WORLD.key`) | DirectionalLight, shadowed (1024², high only) | night: sodium head (−9.6, 7.9, −3) as a point-like pool, radius 6 m; dawn: sun at azimuth +14° (toward +x), elevation 4° → 7° | #ff9b3d → sun #ffc27a → #ffd9a8 | sodium 3.4; sun 2.4 → 2.5 | `uKeySun` = smooth(3.55, 4.10); sun colour and elevation over 3.9–5. Inside the hall it lands only in the dawn wedge (×0.3). |
| `hemi` (`RV.hemi`) | HemisphereLight | — | sky #8f8d88 / ground #2a2723 → #8c9aa8 / #8a7f70 | .07 → .35 | `uDawn`. Inside the hall irradiance ×.72 at night, ×.14 at dawn, so ≤.05. |
| sodium residual | analytic point | (−9.6, 7.9, −3) | #ff9b3d | `uSodRes` | Fills the yard while the key is the sun, until `sodiumOff`. |
| road sodium | analytic point | head (5.1, 8.4, 26.5), radius 6.5 | #ff9b3d | 3.4 (`uRoad`) | Off over 4.33–4.50. The head emitter fades to 12% then out. |
| sconce (left) | analytic point, down-facing | (−5, 6.18, −7.12), radius 1.8, range 7 | #ffd2a1 | 7 (`uSconce`) | × `uSodium`. The right sconce is dead. |
| glow sign | analytic area (lambert, nearest point) | face x ±5.1, y 10.7–12.1, z −7.1 | #f4f1ea | 2.2 (`uSign`) | Lit to the end. |
| seam and under-door line | analytic lines | x 0, y .3–8.9, z −7.62; x ±3.95, y .26, z −7.58 | #e8232a | 2.4 (`uSeam`) | × shut: dark once the leaves part (open > .035). |
| spill wedge | analytic floor term | apex z −7.7, 9 m base at 14 m | #e8232a | 3.2 × `uSpill` (+ emissive .416) | × `uRed`. |
| doorway red | analytic area | jambs and leaves within 6 m | #e8232a | .55 × `uSpill` | Not on the floor (the wedge is the floor's). |
| back wash | analytic line, aimed at the back wall | x ±7.5, y .7, z −40.6, range 16 | #e8232a | 3.4 (`uBack`) | × `uRed`. Plus a 5% bounce at (0, .8, −33.4), range 9. |
| booth tube | analytic line (rim) | x ±2.6, y 7.08, z −36.62, range 9 | #e8232a | 7 (`uTube`) | × `uRed`. |
| booth lamp | analytic point | (.86, 1.39, −31.8), range 2.5 | #ffcf9a | 2.6 (`uLamp`) | × `uRed`. |
| booth strip | analytic line | x ±1.15, y .96, z −31.2, range 1.2 | #ffcf9a | .5 (`uStrip`) | × `uRed`. |

The emitter geometry follows the same circuits:
- The seam and under-door meshes share one material that reads `uSeam`.
- The tube material reads `uTube`.
- The sconce, the sodium heads and the booth bulb are coloured in `updateWorld`.
- The roof sheets follow `uRoofGlow`.

## 4. Interface for later roles

`RV.environment.uniforms` (shared objects, bound into every hooked material):

| Uniform | Meaning | Who writes |
|---|---|---|
| `uSeam`, `uTube`, `uBack` | Base intensities, rewritten every frame by world.js | **Choreo multiplies** (beat ≤ ±5% on the seam at 0–.35, ≤ ±8% on the tube and back wash) |
| `uConeKick` | Cone and cap excursion in metres, applied in the drivers' vertex shader (all 16) | world.js writes 0; **Choreo writes** beat × ≤.03 |
| `uSpill` | Red wedge amount, 0–1 | Provisional in env (below); **Choreo owns** |
| `uDawnSpill` | Dawn wedge amount, 0–1 | Provisional smooth(3.70, 4.35); **Choreo owns** |
| `uDawn`, `uKeySun`, `uRed`, `uSodium`, `uRoad`, `uSodRes`, `uRoofGlow` | Timeline states | world.js only |
| `uLamp`, `uStrip`, `uSconce`, `uSign` | Practicals | world.js only |
| `uSun` | vec3 sun direction (azimuth 14°, elevation 4° → 7°) | world.js |
| `uSky*`, `uSunCol`, `uHaze` | Sky colours | constants, display-solved |
| `uReflection`, `uTextureMatrix`, `uLive` | Planar capture (puddles and wet floor) | env |

**Base values** live in `RV.environment.base`: `{sodium:3.4, road:3.4, sconce:7, sign:2.2, seam:2.4, spill:3.2, back:3.4, tube:7, lamp:2.6, strip:.5}`.

**The pulse, the choreographer's way:**

```js
const prev=updateWorld;
updateWorld=function(dt){
  prev(dt);
  const U=RV.environment.uniforms,b=beat(); // b in 0..1, 0 when paused, in REDUCE, and from 3.70
  U.uSeam.value*=1+.05*b; U.uTube.value*=1+.08*b; U.uBack.value*=1+.08*b; U.uConeKick.value=.03*b;
  U.uSpill.value=yourEnvelope(RIG.smooth); U.uDawnSpill.value=yourDawnEnvelope(RIG.smooth);
};
```

The legacy handles `RV.seamLight.intensity` and `RV.backLight.intensity` are accessors onto `uSeam` and `uBack`. The existing `RV.seamLight.intensity*=…` in choreography.js still lands in the shader. Update order is world (base), then environment (provisional spill, steam colour, drips), then choreography.

**The provisional spill envelope** is `rvEnvSpillEnvelope(p)`. It is a monotone Hermite through (.38, 0), (.55, .80) and (.80, 1), flat at both ends with no overshoot, then multiplied by (1 − dawn). It is a pure function of `RIG.smooth`.

**RV_CONFIG** (timeline authority, also at `RV.config`):

| Key | Window | Notes |
|---|---|---|
| `doorOpen` | [.35, 1.20] | right leaf lags .03 |
| `spill` | [.38, .80] | |
| `beatOut` | [3.40, 3.70] | |
| `dawn` | [3.55, 4.35] | |
| `redOut` | [3.55, 4.10] | |
| `dawnSpill` | [3.70, 4.35] | |
| `sodiumOff` | [4.25, 4.50] | the road lamp follows at [4.33, 4.50] |

`tempo` (140), `travel` and `damping` are unchanged. `RV_CONFIG.camera` and `CAM` are untouched; camera.js overrides them.

**Other handles:**
- `RV.rig`: the light rig.
- `RV.environment.config.bounds`: the boxes in §5.
- `RV.notices`, `RV.exitSign`, `RV.stencil`, `RV.estate`, `RV.drivers.{cone,cap,ring}`, `RV.doors[i].leaf`, `RV.roofSheets`.
- `window.__ravers.WORLD.rv` is `RV`, for diagnostics.

## 5. Geometry bounds and clearances (metres)

| Element | Extent | Camera guidance |
|---|---|---|
| Doorway clear opening | x −4.23…4.23, y .25…9.04 (header underside), wall plane z −7.75…−8.5 | Cross with \|x\| < 3.5 and only when the leaves are open (see below). |
| Thresholds | step 1 x ±4.8, y 0–.25, z −8.05…−5.75; step 2 x ±5.1, y 0–.12, z −7.6…−4.8 | Eye height ≥ 1.8 clears them. |
| Door leaves (closed) | hinges at (±4, −7.7); leaf 3.96 × 8.65 × .2, y .27…8.92 | Outward opening, 83° (1.45 rad) at full. |
| Leaf swing (swept) | x −4.2…4.2, y 0…8.95, z −7.9…−3.6 | Leaves are fully open at 1.20; the right leaf lags .03. |
| Canopy | x ±5.3; slab underside y 9.465 (z −8.05…−4.45); fascia lip underside y 9.32 at z −4.53…−4.43; top 9.66; stays to y ~11.4 at z −6.8 | Keep sightlines to the logo above the lip (ledger rule: camera y ≥ 10.66 − .354·d). |
| Glow sign / logo | box x ±5.31, y 10.53…12.27, z −7.45…−7.19; logo plane z −7.16, 10.25 × 1.48 at y 11.4 | — |
| Facade plane | cladding z −7.75; piers project to z −7.39 at x ±5.0, ±10.3, ±15.7; parapet top y 14.37 | — |
| Notices | centres x −9.0, −7.68, −6.32; y 1.42–1.50; 1.32–1.36 × 1.72–1.86; plane z −7.735 | 00 legibility depends on distance (§7, criterion 4). |
| Yard sodium pole | base (−11, 0, −3); arm and head to (−9.6, 7.9, −3); box x −11.1…−9.3, y 0…8.1, z −3.15…−2.85 | Head on the left frame edge at 0 and 5 from the ledger cameras. |
| Road sodium pole | base (6.5, 0, 26.5), head (5.1, 8.4, 26.5); box x 4.8…6.6, y 0…8.8 | Moved in from x 9 so it sits inside the doorway at 4 and 4.5. Its cables run over the road at y ≥ 6.6. |
| Bollards / grate / coil | bollards (±5.6, 0, −3.6) r .15 h 1.1; grate x ±6, z −3.2; coil (−6.6, −2.4) | Exit lane \|x\| < 3.5 is clear. |
| Road / kerbs | kerbs y 0….16 (2 cm chamfer) at z 17.15…17.45 and 21.45…21.75; asphalt z 17.45…21.55 | The bookend camera at z 19.5–20 stands on the road. |
| Estate | box x −46…46, y 0…9.6, z 21.5…62; compound wall z 28.6 (h 2.5); sheds z 31…62; tanks at (11, ~5.3, 44) and (−12, ~8.6, 40); ventilators at x .6, 3, 5.4, z 40, y 7–8 | Never inside it. Silhouettes from the doorway assume a camera z < −20, looking +z. |
| Hall walls / roof | inner faces x ±10.8, back z −44.1; roof underside ~y 10; columns at x ±10 every 5 m, z −12…−42 | Keep \|x\| < 8.9 near column rows. |
| Speaker stacks | x ±2.61…±5.87, z −36.4…−35.2 (baffle front), top y 6.81 | Frontal shots stop at z > −34.3. |
| Booth (flight case) | x ±1.2, y 0…1.04 (lid), z −32.13…−31.27; decks and lamp to y 1.47 | Camera above y 2.4 or in front of z −30.4. |
| Booth tube | x ±2.7, y 7.11, z −36.62; hangers to the roof | — |
| WAY OUT | (0, 9.82, −8.6), 1.5 × .4, faces −z (into the hall) | Reads from inside only. |
| Roller shutter (back wall) | x ±3.3, y 0…6.2, z −44.07 | — |
| Mezzanine, stair, duct | unchanged from the previous notes: x 7.4…10.8 deck; stair x 8.1…10.25, z −24.5…−17.5; duct x −9.4…−8.1, y 7.4…9.7 | — |

## 6. Planned views rendered (free camera)

All renders are SwiftShader software GL. Directories are under `review/` (git-ignored, local to this checkout).

| Set | Directory | What it is |
|---|---|---|
| Current camera route | `review/environment/` (+ `-portrait`) | `capture.mjs stills --portrait` |
| Ledger views, default post | `review/environment-views/` | `capture.mjs views --views review/environment-views.json` |
| Same views, provisional grade | `review/environment-graded/` | uExp .9 / 1.0 (1.2–1.8) / .6 (3.45–3.75) / .68 (4.25–4.6); uVig .35; uGrain .005; uSat 1 / .95 / 1; uBloom .12 / .14 / .18 / .09; uThr .9 → 1.0 from 3.45 |
| Portrait ledger views | `review/environment-views-portrait/` (390×844) | — |
| LOW tier, ledger views graded | `review/environment-low/` | — |
| LOW tier, current route | `review/environment-low-stills/` | — |
| Reduced motion | `review/environment-reduced/` | — |
| 1.7 m mannequins at the endpoints | `review/environment-mannequin/` | — |
| Doorway at 4, uExp .60 / .65 / .75 | `review/environment-door/` | `d*` = ledger camera, `a*` = shifted 1 m left |

The views JSON (`review/environment-views.json`) uses progress, pos, target and fov:
- v00 0, (3, 2.2, 18.5) → (0, 7, −7.16), 40
- v06 .6, (.84, 3.06, 15.84) → (0, 6.35, −7.16), 38.6
- v10 1, (0, 3.4, 14.8) → (0, 6.1, −7.16), 38
- v20 2, (0, 1.9, −13) → (0, 3.4, −40), 44
- v26 2.55, (−1.12, 1.84, −22.2) → (−.99, 2.9, −37.2), 47.7
- v30 3, (−1.8, 1.8, −27.8) → (−1.6, 2.6, −35.5), 50
- v36 3.55, (−2.2, 2.4, −27.4) → (−9.04, 3, −8.6), 50
- v40 4, (−2.5, 3, −27) → (0, 3.6, 5), 50
- **v40b 4, (−3.5, 3, −27) → (−.6, 3.6, 5), 50**
- **v45 4.5, (.5, 2, −6.5) → (2, 3.2, 30), 50**
- v50 5, (3, 1.9, 19.5) → (0, 6.8, −7.16), 40

Portrait views use the §4 portrait endpoints (`review/environment-views-portrait.json`).

**For the Camera director:**
- At the ledger endpoint for 4, the sun sits on the left jamb, half behind the open left leaf.
- `v40b` (1 m further left, target x −.6) puts the disc fully inside the doorway, over the tank and below the cables. Recommend that endpoint, or anything that keeps the sun inside the opening.
- At 4.5, `v45` frames the road, the compound wall, the sheds with the tank and neem, and the road sodium.
- At 5, the ledger bookend (`v50`) shows the whole logo, the notices, the sun-raked facade and the yard sodium pole on the left edge.
- At 3.55 the current route faces the blank side wall, and `07-turn` is 97% dark. A target toward (−9, 3, −8.6) brings the doorway into the left third (`v36`).

## 7. Budgets (SwiftShader counts, not frame rates)

`renderer.info.render.calls` and triangles are the worst of 3 consecutive frames at each chapter on the current camera route. They include the 16 post passes, the planar capture frame and, on "moving" rows, the shadow re-render.

| Chapter | 0 | 1 | 2 | 3 | 4 | 5 | moving .7 | moving 3.8 | moving 4.5 |
|---|---|---|---|---|---|---|---|---|---|
| High calls | 130 | 119 | 75 | 60 | 103 | 75 | 142 | 145 | 83 |
| High triangles | 50.9k | 49.1k | 45.6k | 39.2k | 40.6k | 40.3k | 58.5k | 62.4k | 31.1k |
| LOW calls | 96 | 90 | 57 | 49 | 77 | 58 | 91 | 77 | 76 |
| LOW triangles | 38.3k | 36.6k | 33.6k | 30.0k | 31.3k | 31.0k | 36.6k | 31.3k | 31.1k |
| Baseline calls, high / LOW | 195 / 187 | 261 / 161 | 104 / 102 | 64 / 64 | 201 / 123 | 94 / 94 | | | |

- Ceilings are ≤240 / ≤140 calls and ≤80k / ≤45k triangles. Peaks are 145 calls / 62.4k triangles on high and 96 / 38.3k on LOW.
- Programs: 28 high, 25 LOW (≤30).
- Scene textures: 92.2 MB → 6.5 MB high and 3.4 MB LOW. Net new memory is negative. Newly authored maps are 5.6 MB high and 2.5 MB LOW, against ceilings of 8 and 3 MB.
- Realtime lights fall from 6 to 2. No render target, full-screen pass or per-frame geometry is added.
- The reflection capture is unchanged (≤512 px, every 3 frames, off on LOW and coarse pointers) and renders layer 0 only.
- No fragment loops in the new code. The wet-floor capture blur is 5 unrolled taps.
- LOW drops shadows, the planar capture, the drip rings and the third steam layer. It halves the floor and concrete maps. It keeps the Spill, the sky and the sunrise.

## 8. Acceptance (ART-DIRECTION §6, Environment)

Metrics come from `scripts/metrics.py`. "Graded" means the provisional grade in §6, the exposures the Grade brief targets. "Ungraded" means the current post (uExp .95, vignette 1).

| # | Criterion | Result | Value |
|---|---|---|---|
| 1 | 00: mean luma .08–.14, dark ≥35%, redTint ≤10% | **Pass** | Ledger v00 graded .097 / 54.3% / 4.8%; ungraded .091 / 59.2% / 6.8%; route still 00 .087 / 53.5% / 6.0% |
| 1 | Skyglow gains ≥.04 from zenith to horizon | **Pass** | .084 → .137 (+.054) |
| 1 | Right third ≥50% darker than the sodium-lit pier | **Pass** | .049 vs .276 (82% darker) |
| 1 | No distant mass lighter than the sky behind it | **Pass** | Every silhouette edge (left neighbour, right neighbour, both frames) is .02–.03 below the sky directly above it |
| 2 | 2 and 3: redTint ≤35%, dark ≥40% | **Pass** | v20 18.3% / 92.6%; v30 34.4% / 78.0% (graded). Route stills 04: 14.8% / 94.1%; 06: 21.1% / 83.5% |
| 2 | Stack interiors ≥.10 luma below the back wall | **Pass at the brief's hall grade; .07 ungraded at 3** | At 2: .025 vs .170 (−.145) graded, −.101 ungraded. At 3: .023 vs .131 (−.108) graded, −.072 ungraded |
| 3 | 4: doorway SD ≥.06, clip ≤1.5% | **Pass at uExp .60–.65** | SD .196–.199; clip .33–.61%. At uExp .75, clip is 1.63–2.59% |
| 3 | Sun and ≥3 rooflines incl. a water tank | **Pass** | Sun disc, compound wall, three sheds, annex, tank directly below the sun, cables, road sodium (v40b; v40 has the sun on the jamb) |
| 3 | No puddle pixel <.1 inside surroundings >.6 | **Pass** | 0 px in v40b. In v40, 9–20 px sit on the door-sill shadow line, not a puddle |
| 4 | No mirrored text, eyebrows, rules or index numbers | **Pass** | All prints single-sided (asserted in test). Door signs, POWER, banners and SAME SOUND removed. WAY OUT faces in |
| 4 | Notice cap height ≥14 px at 00 at 1440 wide | **Pass at the ledger 00** | 16.4 / 14.8 / 16.2 px. On the current (old) route camera: 13.6 / 12.3 / 13.4 px |
| 5 | No texture blotch >12% local contrast | **Pass** | Field contrast: floor ~0%, concrete 3.8%, door 5.0%, galvalume 7.2% (causal streaks and cuts excluded by design) |
| 5 | Floor joints darker than the slab | **Pass** | Saw cut #121110 on #57544f; dark in every floor render |
| 5 | 1.7 m mannequin scale | **Pass** | `review/environment-mannequin/`: reads right against the 8.65 m leaves, 1.1 m bollards and the 1.0 m case |
| 6 | §8 budgets, draw calls recorded | **Pass** | §7 above |

The page loads with no console errors, high and LOW. The reduced-motion stills at 0 and 1 render. `RV_PAGE=dist/preview-environment.html npm test` passes. `tests/scene.test.mjs` tests the archived `dist/world.mjs`, not these modules; it is unchanged and still passes.

## 9. Known limitations and notes per role

**For Grade.**
- Hold the hall near uExp 1.0 with vignette ≤.35. At the default .95 with vignette 1, the stack-to-wall gap at 3 is only .07.
- At 4, uExp .60–.65 keeps the doorway clip at .3–.6%.
- The doorway's mean luma is .60–.62 with its sky at .76–.79. The §3 target of .70 mean is hard to reach without clipping, because the hazed estate silhouettes pull the mean down. If you need it, ask me to raise the haze rather than pushing exposure.
- Bloom threshold ≥1.0 at dawn keeps the bloom to the sun disc.

**For Camera.**
- Use `v40b` rather than the ledger 4 endpoint (see §6).
- The current route does not yet show the bookend 5, the doorway sunrise at 4, or the threshold-out view at 4.5. These render only from the free camera.
- At 3.55 the route faces a blank wall.
- The leaves only clear the opening at full open (1.20).

**For Choreography.**
- Own `uSpill` and `uDawnSpill` as above.
- The `uConeKick` path is wired into all 16 drivers.
- The logo shader hook in choreography.js still applies float and separation; the art direction asks you to retire that.

**Portrait.**
- At the portrait ledger 0, redTint is 15.6% (route still 00-portrait: 11.1%), against ≤10% on desktop.
- The wet apron fills half the frame. It carries the seam's red reflection (allowed red) and a dim sodium tail (hue 15–20°, V ≈ .08) that the ACES toe pushes into the red band.
- Portrait 01 and 02 show redTint of 20.6% and 21.7%, with accentCore 13.2% and 7.5%. That is within §3's ≤15% accent at the wedge peak, but the wedge dominates the lower half by design, so it is the Critic's call.

**Accent at 0.**
- accentCore at 0 is .7–.95%, below §3's 1.5–5%. That accent is the logo's triangles, the seam and the line under the door, so it scales with how wide the Camera frames the logo.
- The seam's wet reflection is already in. If the Critic wants more, the cheapest lever is the seam reflection gain (`line*…*1.1` in `rvEnvHook`). Raising the red light is not a good lever.

**Rendering.**
- The planar capture holds large forms and emitters only. Small hardware is absent from reflections, and the wet floor smears the capture vertically to hide this.
- The analytic pools are unshadowed: the sconce, the glow sign, the back wash and the road sodium do not cast shadows. Only the key does.
- The stacks occlude the back wash only in the floor's analytic mirror term, not in the diffuse lighting of objects behind them.
- None of this is GPU-verified. SwiftShader renders and CPU tests say nothing about real-device shader compile time or frame rate. Check on Android before shipping.
