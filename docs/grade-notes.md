# Colour and post: handoff

Owner: Colour & Post (`src/ravers/grade.js`, `tests/grade.test.cjs`).
Readers: Camera, Choreography, Critic, Integration, Environment.
Brief: ART-DIRECTION.md §3 (proportions and exposure), §6 "Colour & Post", §7 metrics. All renders are SwiftShader software GL: they are true to colour and composition and say nothing about frame rate.

## 1. Read this first

- **The grade is a pure function of `RIG.smooth`.** `RV.grade.sample(progress)` returns every value below. A wrapper on `render()` applies it each frame, before the scene and post passes. Nothing reads the beat. The clock (`clock`, which world.js freezes when paused or in reduced motion) only seeds the dither.
- **Grain is now dither.** Kage added grain in linear light before the encode, so `uGrain` .007 became speckle up to about .07 display luma in every shadow (visible in `review/environment-graded/v20`). It now sits after the encode as ±`uGrain`/2 (±.5 LSB at .004). The hall reads as structure instead of noise.
- **That exposed the scene's real floor.** The hemisphere fill gives a scene black of about .001–.002, and gamma 2.2 turns that into .022–.031 display. The old linear grain had been hiding it: half its pixels clamped to 0. The luma of the shadow split-tone is therefore a per-chapter **black point**: night −.012, hall −.004, dawn −.011, day −.045.
- **The bloom was dead, and is now repaired. Every earlier render had no bloom at all.** Kage's `renderPost` had two bugs.
  - It hands render targets, not `.texture`, to the blur, upsample and comp samplers. three r149 binds nothing for a target, so those passes sampled black and the chain ran 15 passes for nothing.
  - It leaves `renderer.autoClear` on, so each additive upsample wiped its target to the clear colour #05070a. Once the samplers worked, this showed up as a uniform blue-black lift of ~9/255 over the whole frame, with each level's own blur lost.

  Both are fixed from grade.js: the sampler uniforms resolve a target to its texture, and `renderPost` runs with `autoClear` off. No pass, target or uniform is added. With the thresholds below, the bloom now lands only on the sodium head, the sconce bulb, the booth strip and lamp, glints and the sun. The frame mean and every §7 metric are unchanged within .003 luma and .3 redTint points.
- **Bloom takes the displayed hue.** The practicals' HDR colours are display-solved through per-channel ACES inverse, so the sodium head is about 30:1 red:green in HDR. Its live bloom fringed **red** around an orange core, and red bloom is banned. The bright pass now feeds the blur with the hue the viewer sees (the ACES fit at a nominal exposure of .8) at the source's own scene luminance. The sodium glow is now sodium orange, and the sconce and booth glows are cream.
- **`uThr` is scene-referred**, measured before exposure. The dawn sky is 1.0–1.2 at 4.0 and 2.2–2.8 by 4.35 (p99/p995 in the doorway). The brief's "≥1.0 at dawn" would bloom the whole doorway, so the threshold climbs with the sky: 1.9 → 2.9 → 3.0.
- **Red never blooms.** The red emitters (tube, back wash, seam, wedge) have high R but a luminance of only .27–.47, below every threshold (≥1.0).
- **For tests:** `node tests/grade.test.cjs` (reads `RV_PAGE`, default `dist/index.html`; it only needs the engine's `initPost`/`renderPost`, so it passes on either page). **Integration: please add it to `npm test`.** I did not edit package.json.

## 2. The curve

Keys live in `RV.grade.config.keys`. Between keys every value eases with smoothstep, so it is C1 and flat at each key. Holds: night 0–1.20, hall 1.75–3.55, doorway 4.00 (one key), day 4.85–5. Ramps: 1.20–1.75 (the eye adapts as you enter), 3.55–4.00 (the eye adapts to the doorway as the dawn comes up), 4.00–4.25 (the sky doubles; exposure holds the doorway), 4.25–4.50 (stepping out) and 4.50–4.85. Key positions take `doorOpen[1]` and `redOut[0]` from `RV_CONFIG`.

| p (smooth) | uExp | uBloom (LOW ×1.15) | uThr | uKnee | uSat | uVig | uGrain | uShadowTint r, g, b | black point (luma of tint) | uHighTint |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 → 1.20 | .910 | .120 (.138) | 1.00 | .50 | 1.000 | .220 | .004 | −.012, −.012, −.012 | −.0120 | 1, 1, 1 |
| 1.40 | .937 | .126 (.145) | 1.00 | .50 | .985 | .238 | .004 | −.010, −.010, −.010 | −.0096 | 1, 1, 1 |
| 1.60 | .984 | .136 (.157) | 1.00 | .50 | .959 | .269 | .004 | −.005, −.005, −.005 | −.0055 | 1, 1, 1 |
| 1.75 → 3.55 | 1.000 | .140 (.161) | 1.00 | .50 | .950 | .280 | .004 | −.004, −.004, −.004 | −.0040 | 1, 1, 1 |
| 3.621 (turn) | .977 | .143 (.164) | 1.06 | .51 | .953 | .273 | .004 | −.005, −.004, −.004 | −.0045 | 1, 1, 1 |
| 3.70 | .909 | .150 (.173) | 1.23 | .53 | .963 | .254 | .004 | −.007, −.006, −.004 | −.0058 | 1, 1, 1 |
| 3.80 | .796 | .163 (.188) | 1.52 | .56 | .979 | .222 | .004 | −.011, −.007, −.004 | −.0080 | 1, 1, 1 |
| 3.90 | .694 | .175 (.201) | 1.79 | .59 | .994 | .193 | .004 | −.014, −.009, −.004 | −.0100 | 1, 1, 1 |
| 4.00 | .650 | .180 (.207) | 1.90 | .60 | 1.000 | .180 | .004 | −.016, −.010, −.004 | −.0108 | 1, 1, 1 |
| 4.10 | .625 | .180 (.207) | 2.25 | .60 | 1.000 | .180 | .004 | −.016, −.010, −.004 | −.0108 | 1, 1, 1 |
| 4.25 | .580 | .180 (.207) | 2.90 | .60 | 1.000 | .180 | .004 | −.016, −.010, −.004 | −.0108 | 1, 1, 1 |
| 4.35 | .587 | .152 (.175) | 2.94 | .60 | 1.000 | .169 | .004 | −.034, −.021, −.007 | −.0229 | 1, 1, 1 |
| 4.50 / 4.52 | .600 | .100 (.115) | 3.00 | .60 | 1.000 | .150 | .004 | −.067, −.042, −.012 | −.0451 | 1, 1, 1 |
| 4.70 | .612 | .094 (.108) | 2.76 | .60 | 1.000 | .120 | .004 | −.067, −.042, −.012 | −.0451 | 1, 1, 1 |
| 4.85 → 5 | .620 | .090 (.103) | 2.60 | .60 | 1.000 | .100 | .004 | −.067, −.042, −.012 | −.0451 | 1, 1, 1 |

`uCA` is 0 everywhere, and its taps are gone from the shader (§3). `uFade` is untouched: render() still owns it for the intro and the reduced-motion crossfade.

**In one sentence:** night holds at .91 with a neutral −.012 black point, the eye opens to 1.0 for the hall over 1.20–1.75, closes to .65 for the doorway over 3.55–4.00 while the bright-pass threshold climbs so only the sun blooms, holds the brightening doorway at .58 by 4.25, and settles at .60–.62 outside with cool, deepened skylit shadows.

**Relation to the environment's display solve.** Environment authored its display colours (sky, fog, practicals) for exposures night .9, hall 1.0, dawn .62 and day .68 (`RV_ENV_CONFIG.exposure`). The grade sits at .91 / 1.0 / .58–.65 / .62. At 5 the zenith measures (143, 154, 167) against the bible's #8c9aa8 = (140, 154, 168).

**Why each value.**
- **Night .91 and a −.012 black point.** This holds the logo white at .87–.88. It keeps the doors–logo axis readable and drops the darkest 1% to .013.
- **Hall 1.0, saturation .95.** This keeps the stack-to-wall gap the environment asked for. The slight desaturation tames the red's intensity without changing which pixels count as red.
- **Doorway.** The exposure tracks the dawn sky instead of jumping at 3.55. The turn (3.62) still sees the columns and the copper pre-dawn doorway at .977. Ramping to .58 by 4.25 holds the doorway clip as the sky doubles. Without that ramp the doorway box clips 3.4% at smooth 4.15.
- **Day .60–.62.** Mean luma at 5 is .45 or less on the ledger and route cameras. The cool chroma in the shadow tint (blue +.033 against red −.022 around a −.045 luma) gives the cast shadows and wet apron the bible's skylit slate (#6d7d8f) against the warm sun. It applies only from 4.25. The night and hall shadows stay neutral, which avoids Kage's blue-black.
- **Vignette .22 / .28 / .18 / .10.** Its only job is to keep the frame edges (the sodium head, the hall's side walls) from competing with the centre axis. It was lowered from .30 because it was pulling a logo framed high in the frame under .85.

## 3. What was patched

All of this happens once, inside the existing comp and bright passes, by a wrapper on `initPost` (`rvGradePatch`). Each swap matches an exact substring. If any anchor is missing (the upstream shader changed), the grade logs one warning and leaves the shader untouched; the tests fail on that warning.

1. **CA removed.** `float ca = …` and the three per-channel fetches become `vec3 c = texture2D(tS, vUv).rgb;`. This makes one scene fetch instead of three, and CA can never come back through `uCA`.
2. **Split-tone, two uniforms.** Kage's two neutralised constants (`c*vec3(1.0,1.0,1.0)`, "teal shadows" and "warm highs") are replaced by exactly two new `vec3` uniforms:
   - `uHighTint`: `c *= mix(vec3(1.0), uHighTint, smoothstep(0.25,1.0,l))`, in linear after ACES. It is neutral (1, 1, 1) everywhere, so it adds no cast to the logo white or the sun. It is kept as a slot for the critic round: a warm-highlight request becomes a data change, not a shader change.
   - `uShadowTint`, after the encode, in display units:
     - Its luma `sm` is a black point, applied as a luma-ratio toe: `e *= max(le + sm*wb, 0)/le`, with `wb = (1 − smoothstep(0, .25, le))²`. Hue and saturation are preserved, and only values below about .2 move.
     - Its chroma (`uShadowTint − sm`) is added with a weight that peaks between .08 and .18 luma and is gone by .55.
     - **Never red:** `sample()` clamps red to at most min(g, b), and the test checks 10,001 samples.
3. **Grain becomes dither.** The linear-light `c += (g−0.5)*uGrain` is removed. The same hash, seeded by `uT` (= `clock`), is added after the encode and the shadow toe: `clamp(e + (g−0.5)*uGrain, 0, 1)`.
4. **Kept as is:** exposure, the ACES fit, saturation, the vignette shape, `uFade`, the gamma 2.2 encode and the (identity) contrast line.

**`POST.bright`.** `uThr` and `uKnee` are driven per frame (table above). One line of its shader is patched: `gl_FragColor = vec4(c*k, 1.0)` becomes `d * (l / luma(d)) * k`, where `d = acesFit(c*0.8)`. That is the displayed hue at the scene luminance. No uniform is added.

**Bloom chain repair (no pass, target or uniform added).**
- `tS`/`tB` on comp, bright, blur and up become accessor uniforms: assigning a render target stores its `.texture`. `renderPost` is untouched, and three reads `uniform.value` through the getter.
- A `renderPost` wrapper sets `renderer.autoClear=false` for the chain and restores it after. `pass()` already clears explicitly before every non-additive pass, so only the additive upsamples change: they now accumulate onto their target as Kage intended.
- Measured after the repair, bloom on against off on the same frame:
  - sodium head: up to +61/255 at the head, under +2.5/255 by 64 px;
  - sconce: +47/255 at the bulb, +.6/255 by 64 px;
  - logo letters: 1 px;
  - hall and booth: only the booth strip and lamp;
  - dawn: a soft disc around the sun only.

**LOW: two bloom levels.**
- The `initPost` wrapper splices `POST.levels` down to two and disposes the two cut levels' render targets.
- `renderPost` and `resize()` iterate whatever levels exist, so no loop is skipped and nothing new is drawn. That gives 8 post passes instead of 16, which meets the "≥8 passes removed on LOW" rule.
- Two levels carry less halo energy, so on LOW `uBloom` is multiplied by `lowBloomGain` 1.15. The bloom is still confined to the practicals and the sun.

**No new pass, render target, loop, RAF or per-frame allocation.**
- `sample()` writes into one reused object.
- The test counts targets (9, unchanged), passes (16 high, 8 LOW), and scans the source for `new THREE.WebGLRenderTarget`/`ShaderMaterial`, `renderer.render(`, `pass(`, the beat and the clock. It also checks the bloom repairs: 16/16 passes run with `autoClear` off, targets resolve to textures, and the bright pass gains no uniform.

**`RV.grade`:**
- `sample(p[, out])` is pure.
- `config` holds the key table, `lowLevels` and `lowBloomGain`.
- `state` holds the last applied values.
- `patched` and `low` report the patch state.
- `uniforms` holds the two `vec3` uniforms.
- `dispose()` restores both original fragment shaders, the uniform values, the bright-pass values and plain sampler uniforms, removes the two uniforms, and stops driving POST and `autoClear`. Integration: `rvDispose` in host.js could call `RV.grade?.dispose?.()` alongside environment and choreography. POST resources are disposed there anyway.

## 4. Acceptance (ART-DIRECTION §6, Colour & Post)

**How these were measured.**
- Ledger views (`review/grade-views/`, `review/grade-views-portrait/`) use the planned cameras. Route stills (`review/grade/`) use the camera route as it stood mid-edit; the Camera director is still changing it. LOW is in `review/grade-low/` (`?q=low`).
- Metrics come from `scripts/metrics.py` unless noted.
- Pre-grade references are `review/environment/` and `review/environment-views/`.

| # | Criterion | Result | Measured |
|---|---|---|---|
| 1 | Forward and reverse scrubs match (≤1/255) | **Pass** | 18 settled poses, 0 → 5 → 0 (`review/grade-reverse*`). Frozen clock: max .18/255. Running clock (dither and ambient motion included): max .50/255. CPU: 501 samples forward equal reverse, bit for bit. |
| 2 | Logo white .85–.95 at 0 and 1 | **Pass** | White-pixel median: v00 .882, v06 .878, v10 .875; portrait p00 .871; route 00 .876, 02 .859. Neutral: p95 \|R−B\| = 1/255. |
| 2 | ≤.3% clips outside emitters at 0 and 1 | **Pass on desktop; fails in portrait at 1 (not a grade lever)** | Desktop: 0–.01% (v00, v06, v10, route 00–02). Portrait: p10 1.12%, route 01-p 1.12%, 02-p 1.41%. All of it is the pink specular streak inside the red wedge: scene red 9–47 at p95–max, so 3–15× past the clip point at any exposure in the brief. See §6. |
| 3 | Env criterion 3 at 4: doorway SD ≥.06, clip ≤1.5% | **Pass** | v40b doorway (mean .64) SD .19, doorway clip .66%, frame .05%. Portrait p40: doorway SD .17, frame clip 1.27%. LOW v40b: frame clip 1.03%. Bloom stays on the sun only (thr 1.9). Sun, rooflines and the tank are unaffected. The dawn black point is −.011, so no puddle is crushed. |
| 3 | At 5: mean luma .28–.45, dark ≤15%, median saturation ≥.15 | **Pass (high tier)** | v50 .447 / 4.3% / .186. p50 .340 / 4.6% / .168. Route 10 .411 / 5.3% / .231. Route 10-p .322 / 11.7% / .194. **LOW v50: .496 / 2.2% / .242**. LOW has no shadow map, so the facade carries no cast shadows (§6). |
| 4 | Bloom halo ≤6 px around the logo letters | **Pass** | Bloom on against bloom off, same frame (forced reflection capture): 1 px, which is the antialiased letter edge (p95 lift ≥2/255 only in ring 1) at v00, v10 and v50. The logo's scene luminance (.93–.95) sits below `uThr` 1.0. |
| 4 | Bloom changes redTint by ≤2 points | **Pass** | Δ ≤ .3 points (v00, v06, v10, v20, v30, v40b, v50). Red emitters never reach the threshold. |
| 5 | Nothing reads the beat; the clock only seeds grain | **Pass** | Source scan in the test (no beat, tempo, `WORLD.uT`, clock, `Date.now` or random outside the shader's dither). The dither seed `uT` is `clock`, which is frozen when paused or in reduced motion. |
| 6 | Darkest 1% ≤.02 | **Pass on every ledger view except v45; fails on route 09 and LOW day** | Ledger: .004–.020 (v00 .013, v20 .008, v30 .004, v40b .016, v50 .018). Fails: v45 .148, route 09-walk-out .068 (portrait .122), LOW v50 .026, LOW v45 .24. These frames are haze and sky with no surface darker than about .15, so the black point cannot reach them without crushing the morning. |
| 6 | No new pass or render target | **Pass** | Test: 9 targets, 16 passes high, 8 LOW. Two `vec3` uniforms added. |
| — | Vignette ≤.35, grain ≤.006, CA 0 | **Pass** | Max .28, .004, 0 (10,001 samples). |
| — | LOW: two bloom levels or none | **Pass** | Two levels, 8 passes. LOW stills render cleanly (`review/grade-low/`). |

**Other §3 targets.**
- **Night at 0:** mean v00 .094, dark 55.3% (target .08–.14, ≥35%).
- **Hall at 2 and 3:** v20 16.8% redTint / 92% dark; v30 33.5% / 78%; portrait p30 35.5% (≤35% at the edge, the camera's framing).
- **Doorway mean:** .64 at 4 (portrait .66), below §3's .70. The environment notes say .70 cannot be reached without clipping inside the brief's exposure range. Raising the haze (Environment) is the lever.

## 5. For the choreographer: leave exposure alone

- Do not write any `POST.comp` or `POST.bright` uniform, and do not write to `RV.grade`. The grade rewrites all of them inside `render()`, after every `updateWorld`, so a write would be silently overwritten each frame. The art direction also bans anything beat-synced on the grade.
- You own the beat and the spill: multiply `uSeam`, `uTube` and `uBack` (§5 limits), write `uConeKick`, `uSpill` and `uDawnSpill`. Those are scene light, and the grade treats them like any other light.
- **Keep red emitters below luminance 1.0.** Red never blooms today because the tube, back wash, seam and wedge sit at .27–.47 against `uThr` ≥1.0. A ×2 on any of them would still be safe; a ×3 would not.
- **Keep the logo below the bloom threshold.** At 0–1.2 the logo white has a scene luminance of .93–.95 against `uThr` 1.00. That margin is why the halo is 1 px. Anything that brightens the logo material (the old emphasis gain did ×1.16) would push it over the threshold and grow a halo. It would also push the white past .95 display.
- If a moment needs to read brighter or darker, change your light multipliers within §5, never the exposure.

## 6. Known limits and notes per role

**For Camera.**
- The grade does not depend on framing. It holds at 0–1.2, 1.75–3.55, 4.0 and 4.85–5, and ramps between.
- At 4.5 the planned view (v45) and the route 09 are haze and sky with nothing dark in frame: mean .53–.61, darkest 1% .07–.15.
  - If 4.5 keeps the door jamb or a leaf in frame, the black point gives it a true black and the mean drops toward .45.
  - Pushing exposure lower would leave the brief (.60–.75) and darken the morning.
- Portrait at 1: framing less of the wedge's hot core helps the clip (see Environment below).

**For Environment.**
- **The wedge's specular streak clips** (pink, 254/152/169) in portrait at 1: 1.1–1.4% of the frame, scene red up to 47. It is also the "pink hotspot" from §2.6 of the art direction. Lowering that streak's gain is the fix; exposure cannot be.
- **LOW at 5** has no cast shadows, which puts the mean at .496. If wanted, darken the LOW day fill a little or ask me for a LOW exposure trim (−.04).
- **Doorway mean** at 4 is .64 (§3 asks .70–.92). Your offer to raise the haze is the right lever.

**For everyone (Environment, Choreography, Critic).** Renders made before this handoff had no working bloom (§1). After the repair, frame-level metrics move by ≤.003 mean luma and ≤.3 redTint points. What you will see is new local glow on the sodium head, the sconce, the booth strip and lamp, and the sun. If a practical now reads too hot, lower its emitter, not the bloom.

**For Integration.**
- Add `node tests/grade.test.cjs` to `npm test`.
- Optionally call `RV.grade?.dispose?.()` in `rvDispose`.
- **Capture tool:** `look()` (views mode) and stills can show a planar puddle reflection captured from the previous or the route camera, because the capture runs every third render. A/B diffs of the same view differed by 7/255 on the apron until I forced the capture onto the free-camera render (`E.reflectionValid=true; E.lastCapture=E.frame-1` before `look`, or `RV.environment.invalidate()` before `pose`). Worth fixing in `capture.js` before the Critic's evidence matrix.

**General.**
- **Split-tone is subtle by design.** There is no tint at night or in the hall, only a little cool in the dawn interior, and cool skylit shadows outside from 4.25. Hue is never shifted toward red.
- **The black point is a toe, not a lift.** It only darkens, and below about .2 display luma.
- **GPU.** The patched shader compiles and renders in SwiftShader (no console errors, high and LOW). It is untested on real GPUs and Android.
