# RAVERS.IN hero: art direction

This brief binds every role and overrides older notes in `docs/`. "Progress" means `RIG.smooth` (0–5). Capture moments are raw scroll positions; `rvTravel` maps .6, 1.6, 2.55, 3.55 and 4.5 to .716, 1.716, 2.621, 3.621 and 4.52. TS is `vendor/taste-skill/`; PS is `vendor/pro-skill/`. Section 9 says which wins when they disagree.

## 1. Brief, subject, idea

**Reading.** RAVERS.IN is an independent techno collective from India. The hero gives a stranger one of its nights through a building and the collective's mark alone: an estate shed at 23:00, inside, the sound system, out into first light. There are no people (the first house rule is NO PHOTOS) and no copy beyond what the building carries. The journey is right; the renders are generic. Make every frame Indian and monsoon-wet, keep red as the collective's signal only, and carry one idea through.

**Inventory.**
1. RAVERS**.IN**: the name is a domain, and the red waveform sits where its dot would be.
2. The mark's only shapes: two red triangles, A = ▲ and V = ▼.
3. Logo red, the #e8232a family, on black.
4. An estate shed: galvalume, concrete piers, a compound wall opposite, black water tanks on neighbouring roofs, turbo ventilators.
5. A sodium (HPS) streetlight that switches off at first light.
6. The monsoon: wet apron, puddles, canopy drips, black water streaks.
7. The backlit flex glow-sign board, the way India lights shop names. The logo is mounted as one.
8. 23:00 → first light, ending on a hazy low sun you can look straight at.
9. 140 BPM, felt through a closed door.
10. Wheatpaste house rules: NO PHOTOS / BE PRESENT / LOOK AFTER EACH OTHER.
11. Translucent roof sheets, which pale first at dawn.
12. A trimix floor with saw-cut joints.

**Idea.**

> On this page, **the two red triangles of the RAVERS.IN wordmark** become **the light through the warehouse doors**: a red ▲ spilling out across the wet apron at 23:00, and the same doorway throwing first light back in at dawn.

In plan, the two spills meet at the threshold the way the A and V meet in the mark. The progress-1 frame stacks three things on one vertical axis: the logo's ▲▼, the open door, and the red ▲ wedge on the ground.

**Competitor test.** Put Berghain in the sentence and it breaks: Berghain has no triangles, and its story is the door policy. Boiler Room's story is the filmed crowd. "Doors open, red light pours out" on its own is the category. The idea passes only because the wedge is the logo's triangle, composed under the logo, in a sodium-lit, wet Indian estate. If the wedge stops reading as a triangle, the idea is gone.

## 2. Baseline critique (`review/baseline/`)

1. **The sunrise is a void.** In `10-afterglow`, `09-walk-out` and `08-first-light` the doorway is flat bone with no sun, sky or estate. In 10, 34% of the frame is bright with luma SD .043.
2. **The hall is a monotone red wash.** `04-hall` is 73% red-tinted; 03, 05 and 06 sit at 72–75%. Nothing leads.
3. **The facade is flat-lit by sources you cannot see.** `00-entrance` is only 5.8% truly dark, the sky is a flat #2a2a2a band, and the sconces emit nothing.
4. **The turn is dead.** `07-turn` faces a blank corner, with mirrored banners and a blown doorway sliver.
5. **The in-world text is broken.** Banners read mirrored (`07`, `08`). Prints carry an "R / INDEPENDENT TECHNO CULTURE" eyebrow and hairline rules, the door says "R / 01", and a banner hits the frame edge in `04`.
6. **The floor is plastic.** In `04` and `05`: glossy panels, bright joints and centre seam, uniform roughness, and a pink hotspot.
7. **Procedural camouflage** on the door leaves (`00`, `10`) and the desk top (`06`).
8. **The booth is a toy** (`05`, `06`): eye-like white cones, pink platters, tape Ls that read as crop marks, a black slab between the stacks, a tiny 140.
9. **The accent leaks** (`00`–`02`): pink rims on every trim, a red wash on the apron, and a red seam hairline across `02-threshold`.
10. **Portrait is the desktop frame squeezed.** `review/ad/00-entrance-portrait.png` is 31% flat sky; `10-afterglow-portrait.png` is about 60% white void.

**Kage habits still carried** (from PS `kage-anatomy.md`):

| Habit | Seen | Owner and fix |
|---|---|---|
| Kage temple floor `texFloor` (4×4 tiles plus fbm overlay) and `texWall` | plastic panels | Env: own trimix and concrete |
| `fbmCanvas` noise used as surface colour | camouflage | Env |
| Moonlit key plus hemisphere fill | even facade | Env: motivated sources |
| Fog on dark distant masses (Kage's own "pale band" failure) | pale slab at the left of `00` | Env: fog colour and flags |
| Finish: `uVig` still 1, grain, `uSat` 1.05 | dark corners in `04`–`06` | Grade |
| Blue-black world, vermilion accent, grain | Kage-adjacent identity | All roles; the Critic audits originality against `dist/landing-pages/kage.html` |

Kept on purpose: the damped conductor, six `[data-cam]` anchors, the HDR post chain and one renderer. Already retired: the Catmull–Rom path, the `fitAspect` dolly, WORD, the card cameras, the wisps and the cut-outs.

**3D tells, banned in every role.**

| 3D tell | DOM equivalent |
|---|---|
| Void sky | placeholder or gradient field |
| Red on every surface, pink rims | neon glow; accent used as border |
| Camouflage noise, uniform gloss | grain overlay; default kit |
| Floating slogans, eyebrows, rules, "01" | statement cards and label tells |
| Evenly spaced bright ribs, 1px wires, tape Ls | design-tool chrome |
| White-ring speakers | icon in a square |
| Sourceless light | "everything medium" |
| Floating or exploding logo | logo explode |
| Black puddle blobs | broken fallback |

Also banned: god rays, lasers, flares, chromatic aberration, vignette rings, glow halos, camera shake.

## 3. World bible

**Scale and silhouette.**
- 1 unit = 1 m, and a human is 1.7 m.
- Eye height is 1.8–2.2 m on foot. Use 3–3.4 m only for the progress-1 and progress-4 frames.
- The bay doors are 8 × 8.65 m, the hall 22 × 36 × 10 m, and the stacks 6.95 m tall (monumental on purpose).
- The language is squared, heavy and industrial. Equipment is rounded; only cables and pipes curve.
- Detail runs in three levels: shed mass and roofline (tanks, ventilators); doors, canopy, stacks and columns; bolts, notices and cables. Every chapter must stay identifiable as a grayscale thumbnail with the small props hidden.
- Forms within 10 m of an endpoint get a 1–2% chamfer.
- Only the door frame may cut the frame edges (≤12% each).

**Material families.** Colour maps use `sRGBEncoding`; data maps stay linear. No fbm noise as surface colour.

| Family | Albedo | Response | Causal wear |
|---|---|---|---|
| Cast concrete | #6f6b64 | rough .85–.95 | streaks #2c2b27 0.3–1.5 m under every ledge; dark splash band 0–.4 m |
| Trimix floor and apron | #57544f dry / #2a2927 wet | rough .2 wet or trodden → .9 dry | darker saw cuts every 3.6 m; polished lane; puddles in low spots |
| Galvalume | #7d817f | metal .9, rough .45, trapezoidal profile | rust ≤2%, only under fasteners and in the bottom 30 cm |
| Painted steel | #141515 | metal 0, rough .55 | primer #5e5e58 at edges, handles and the kick zone |
| Structural steel | #1b1c1d | metal .7, rough .6 | dust on top flanges |
| Gear | #0f0f0f, cones #1a1a1a | tolex .8; aluminium edges metal 1, rough .35 | scuffed corners |
| Notices | paper #d9d4c7, ink #151612 | rough 1 | bubbled paste, torn corners, wet bottom edge |

**Light roles.** One shadowed directional serves the whole journey: it is the yard sodium at night and rotates to the sun at dawn. There are no other new realtime lights; pools are analytic.

| Progress | Key | Fill | Rim | Practical | Emissive |
|---|---|---|---|---|---|
| 0–1.2 | yard sodium #ff9b3d plus pool | skyglow hemisphere ≤.08 | red seam on door edges only | left sconce #ffd2a1 (right one dead) | glow sign #f4f1ea, sodium heads, seam, under-door line #e8232a |
| 1.2–3.4 | red back wash, ≤16 m range, behind the stacks | ≤.05 neutral | booth tube on cabinet edges | booth lamp #ffcf9a, 2.5 m | tube, seam spill |
| 3.55–4.35 | sun #ffc27a, azimuth +14° toward +x, elevation 4° | sky rising to .35 (#8c9aa8) | sun on column edges | — | sun core #fff1d6, roof sheets |
| 4.35–5 | sun #ffd9a8, elevation 7° | sky #8c9aa8, shadow #6d7d8f | — | glow sign, outshone | logo |

Night skyglow runs #120f0c (zenith) to #2e2318 (horizon); the dawn sky runs #f2b77a → #cdb9a2 → #8c9aa8. These gradients are physical, not decorative, and no sky hue may fall between 260° and 330°.

**Fog and weather.**
- `FogExp2`: exterior night #15100b at .010, so distant masses sink into the skyglow rather than reading as pale slabs; hall #060606 at .014; dawn haze at .004–.006.
- **Wet ground: yes. Falling rain: no.** From PS `threejs-weather`, take only "Wet ground": lower roughness, puddles, and ring sprites, used here for canopy drips. Falling rain is out because it would compete with the wedge, read as the generic neon-rain look, add a full-frame transparent layer on LOW, and freeze into streaks under reduced motion.
- Lightning is a strobe, so it is banned.

**Proportions and exposure.** Metrics are defined in §7.

| Progress | Ground | Ink | Accent | Field | Exposure |
|---|---|---|---|---|---|
| 0–1.2 | night shadow 55–70% | 20–30% | 1.5–5% at 0; ≤15% at the wedge peak | sodium ≤15% | mean luma .08–.14; dark ≥35%; logo white .85–.95 |
| 1.2–3.4 | darkness 50–65% | 10–20% | emitters ≤3%; redTint ≤35% | red at the booth end only | dark ≥40% |
| 3.55–4.35 | interior dark | — | → 0 | dawn doorway 8–20% | doorway luma .70–.92, SD ≥.06, clip ≤1.5% |
| 4.35–5 | cool shadow 30–40% | sunlit facade 40–55% | logo only, .5–3% | sky held in the puddles | mean luma .28–.45; dark ≤15%; median saturation ≥.15 |

The tone curve is ACES with no lifted blacks: the darkest 1% must be ≤.02 luma.

**Red may appear only in:** the logo, the seam and under-door line (0–1.2), the spill wedge, the booth tube and back wash, and surfaces within 6 m of a red source, including their wet reflections. **Never in:** the sky, fog, grade, bloom, trims, notices, WAY OUT, the cones, or dawn light, and nowhere after 4.35 except the logo.

## 4. Per-chapter look and scene ledger

| Capture (smooth) | Frame | Dominant | Light key | Must read |
|---|---|---|---|---|
| 0 | Facade at 23:00 from the road; doors shut; sodium head at the left edge; wet apron in the lower third | doors and logo on one axis | sodium from the left, glow sign, seam; right third dark | whole logo; notices |
| .6 (.72) | Slow push; leaves part; a red blade opens into a ▲, apex at the threshold | wedge and doorway | red takes the apron centre | wedge reads as a triangle |
| 1 | Logo, the doorway onto the deep red hall, the wedge | triptych ▲▼ / door / ▲ | as above | logo ≥42% of frame width |
| 1.6 (1.72) | Crossing, with the door frame at both edges | red far end, framed | near hall dark | threshold; no hairline |
| 2 | One-point corridor; columns and trusses in silhouette | speaker wall against the back wash | back wash, tube, one floor streak | the room's scale |
| 2.55 (2.62) | Low 3/4 approach | left stack rising | red cabinet rims | cones move on the beat |
| 3 | Low 3/4 at the booth | stack as a monolith on the left; decks and lamp lower right | red rim, warm practical | 140; real gear |
| 3.55 (3.62) | Mid-turn to the left; columns lead to the doorway entering the left third; beat stopped | converging columns | red dimming; roof sheets paling | doorway visible, no blank wall |
| 4 | Doorway as a window: hazy sun over rooftops and tanks; gold band narrowing to the threshold | doorway sunrise | warm haze; hall dark | sun, rooflines, WAY OUT |
| 4.5 (4.52) | At the threshold, looking out: road, compound wall, road sodium switching off | estate at first light | low sun; cool puddles | India, morning |
| 5 | Outside, turned back: facade in first sun, doors open; bookends 0 | facade and logo | low raking sun from camera-right | whole logo; notices |

**Scene ledger.** These are starting endpoints for the Camera director to verify. The logo's bottom edge clears the canopy lip when camera y ≥ 10.66 − 0.354·d, where d is the distance to the logo plane at z −7.16.

| Ch | Desktop p / t / fov | Portrait p / t / fov | Seam occluder | Light and fog state | Focus |
|---|---|---|---|---|---|
| 0 | (3, 2.2, 18.5) / (0, 7, −7.16) / 40 | (.5, 2.2, 19.5) / (0, 3.2, −7.16) / 64 | closed doors | sodium 1, sconce 1, seam 1 with beat leak; fog .010 | logo, doors, seam, notices |
| 1 | (0, 3.4, 14.8) / (0, 6.1, −7.16) / 38 | (0, 2.6, 16) / (0, 4, −7.16) / 66 | open leaves | adds spill 1; back wash visible at depth | logo, doorway, wedge |
| 2 | (0, 1.9, −13) / (0, 3.4, −40) / 44 | (0, 1.9, −12) / (0, 3.8, −40) / 62 | facade wall and door frame (crossing ≈1.6) | back wash 1, tube 1, fill ≤.05; fog .014 | stacks, booth |
| 3 | (−1.8, 1.8, −27.8) / (−1.6, 2.6, −35.5) / 50 | (−.8, 1.8, −27.6) / (−1.4, 2.8, −35.5) / 66 | none | adds booth lamp; beat on | left stack, decks, 140 |
| 4 | (−2.5, 3, −27) / (0, 3.6, 5) / 50 | (−1.2, 2.6, −25) / (0, 3.8, 5) / 62 | column row and left wall during the turn | sun at 4°, red 0, roof sheets pale, haze outside | doorway, sun, WAY OUT |
| 5 | (3, 1.9, 19.5) / (0, 6.8, −7.16) / 40 | (.5, 2.2, 20) / (0, 3.4, −7.16) / 64 | door frame at the exit (≈4.5) | sun at 7°, sky .35, sodium off, sign on; haze .004 | logo, doors, notices, puddles |

## 5. Motion

**Budget.**
- One signature move.
- Each chapter arrives as a camera settle into the existing holds, with at most one quiet light event.
- Pointer parallax ≤.1 m, desktop only.
- One ambient layer, driven only by `WORLD.uT`:
  - puddle ripples;
  - two canopy drip rings, one every 1.6 s, growing to 25 cm;
  - the existing vent fog;
  - three ventilators at .35 rev/s;
  - the cones.

**Signature: The Spill (.35–1.20, `RV_CONFIG.doorOpen`).**
- The leaves part, with the right leaf lagging .03.
- At .38 the seam becomes a red blade on the wet apron, opening into a ▲ about 9 m wide and 14 m long with its apex at z −7.7.
- It is full at .80, then held × (1 − dawn).
- Ease in and out, no bounce.
- Meanwhile the logo, the sodium and the facade stay still (no beat), and the camera only pushes.
- Its rhyme, the dawn band (3.70–4.35), is a change of light, not a move.

**Quiet events.**

| Progress | Event |
|---|---|
| 0–.35 | seam pulse |
| 3.40–3.70 | beat stops (the music ends first) |
| 3.55–4.10 | red fades |
| 3.55–4.35 | dawn |
| 4.25–4.50 | both sodium lamps switch off |

The glow sign stays lit to the end.

**Banned:** shake, roll, FOV pumping, flicker, strobe and lasers; anything beat-synced on the camera, grade, logo or fog; logo float or separation; overshoot; and anything that is not a pure function of `RIG.smooth` and `WORLD.uT`.

**140 BPM rules.**
- Exactly 140/60 Hz (2.33 Hz, under the 3 Hz flash limit), driven by `WORLD.uT`.
- Shape: the pow(.5+.5cos, 10) pulse, × (1 − smooth(3.40, 3.70)).
- Felt only in:
  - the seam, 0–.35, ≤ ±5%;
  - the booth tube and back wash, ≤ ±8%;
  - cone excursion, ≤3 cm.
- Mean frame luma changes by <3% peak to trough, and no region changes by ≥10% per beat.

**Reduced motion and pause.**
- The beat is 0, ambient motion is frozen, and the grain holds still.
- Integer chapters are complete composed views: closed doors with a steady seam at 0, the full wedge at 1.
- Colour and light state still change.

## 6. Roles

### Environment & Lighting: `world.js`, `environment.js`

**Skills.**
- PS `build-threejs-scroll-worlds/SKILL.md`, "Give the world real detail"
- PS `references/world-bible.md` §6–§7
- PS `threejs-weather/SKILL.md`, "Wet ground" only

**Brief.**
- Build §3 as specified.
- **Facade light.** Retire the night frontal key and take the hemisphere fill to near zero. Add a yard sodium pole at about (−11, 0, −3) whose head sits on the left frame edge at progress 0 and 5, and a road pole across the street at about (9, 0, 27), visible at 4–4.5.
- **Sky and estate.** Replace `dawnPlane` with a single-draw sky that carries the skyglow, the haze and a sun disc of about 1.2°. Across the road (z +22 to +60), build one merged estate mesh: compound wall, sheds 4–7 m tall, two water tanks and three sagging cables. The roof sheets glow at dawn.
- **Interior cleanup.** Remove the banners, the SAME SOUND sign, the door signs and the POWER print. All prints become single-sided, with no eyebrows, rules or captions.
- **Interior props.** Add a 0.45 m white "140" stencil on the booth front. WAY OUT faces inward. The cabinets and drivers are black, the booth is a flight case, and the decks have real proportions. Instance the 48 cone, cap and ring meshes.
- **Interior light and puddles.** Keep red confined so the middle of the hall stays dark. Puddle fallback follows the current sky. Both wedges are analytic terms driven by `RV.environment.uniforms.uSpill` and `uDawnSpill`.
- **Timeline.** Add to `RV_CONFIG`: `spill`, `beatOut [3.40,3.70]`, `redOut [3.55,4.10]`, `dawnSpill [3.70,4.35]`, `sodiumOff [4.25,4.50]`.
- **Handoff.** Remove the beat from world.js. Base intensities must be steady and recomputed every frame.

**Acceptance.**
1. **At 00:** mean luma .08–.14, dark ≥35%, redTint ≤10%. The skyglow gains ≥.04 luma from zenith to horizon. The facade's right third is ≥50% darker than the sodium-lit pier. No distant mass is lighter than the sky behind it.
2. **At 2 and 3:** redTint ≤35% and dark ≥40%. The stack interiors sit ≥.10 luma below the back wall.
3. **At 4:**
   - doorway SD ≥.06 and clip ≤1.5%;
   - the sun and at least three rooflines, including a water tank, are visible;
   - no puddle pixel is below .1 luma inside surroundings above .6.
4. **Text.** Across every still: no mirrored text, eyebrows, rules or index numbers. Notice cap height is ≥14 px at 00 at 1440 px wide.
5. **Surfaces.** No texture blotch exceeds 12% local contrast. Floor joints are darker than the slab. A debug 1.7 m mannequin at each endpoint looks right in scale.
6. **Budget.** The §8 budgets are met, with draw calls per chapter recorded in `docs/environment-notes.md`.

### Colour & Post: `grade.js`

**Skills.**
- TS `colour.md` §3 and §6
- PS `build-threejs-scroll-worlds/SKILL.md`, "Lighting and atmosphere"
- PS `references/quality-and-qa.md` §6

**Brief.** Drive `POST.comp` and `POST.bright` as pure functions of progress. Start from these values:

| Progress | uExp | uBloom | uThr | uSat |
|---|---|---|---|---|
| 0–1.2 | .85–.95 | .10–.14 | ≥.9 | 1.0 |
| 1.2–3.4 | .95–1.05 | .12–.16 | — | .92–.97 |
| 3.55–4.2 (eye adapting) | .55–.65 | .16–.20 | ≥1.0, so only the sun blooms | — |
| 4.35–5 | .60–.75 | .08–.10 | — | — |

- Set `uVig` ≤.35, down from Kage's 1. Keep `uGrain` ≤.006 as dither only, and `uCA` at 0.
- At most two vec3 split-tone uniforms may be added inside `POST.comp`. Never tint shadows red.
- LOW gets two bloom levels or none.
- Tune after the environment handoff and record the values in `docs/grade-notes.md`.

**Acceptance.**
1. Forward and reverse scrubs produce matching stills (mean difference ≤1/255).
2. At 0 and 1, logo white is .85–.95 luma, and ≤.3% of the frame clips outside emitters.
3. Environment criterion 3 holds, and at 5: mean luma .28–.45, dark ≤15%, median saturation ≥.15.
4. The bloom halo is ≤6 px around the logo letters, and bloom changes redTint by ≤2 points.
5. Nothing reads the beat; the clock only seeds the grain.
6. The darkest 1% is ≤.02 luma. There is no new pass or render target.

### Camera director: `camera.js`

**Skills.**
- PS `build-threejs-scroll-worlds/SKILL.md`, "Author the camera as cinematography"
- PS `references/realtime-architecture.md` §6, "Responsive camera" and "Collision guard"
- PS `references/quality-and-qa.md` §2–§3

**Brief.**
- Author the §4 ledger endpoints, desktop and portrait.
- Hold the push through the Spill.
- The 3→4 turn goes left, across the column row.
- For 4→5:
  - exit through the centre (|x| < 3.5);
  - turn left only after z > −3, using sub-keys as needed;
  - end on the bookend frame (same side as progress 0, lower, closer).
- Publish updated `RV.camera.windows` (add `exit` and `bookend`) in `docs/camera-notes.md`.

**Acceptance.**
1. Over 0–1.15, on four aspects, all logo corners stay in frame and unoccluded. Logo width is 32–40% of frame at 0, ≥42% at 1 and 30–40% at 5. Portrait: logo ≥65% of width; sky ≤15% of height at 0 and ≤18% at 1.
2. Roll is 0 everywhere, and pitch stays within ±20°.
3. No frame is more than 45% one featureless surface (check 3.55–3.9 in the video). At 4, the doorway fills 8–18% of the frame with the sun inside it.
4. Near-plane clearance holds over 10,001 samples × 4 aspects, including the exit through the door leaves.
5. Peak yaw rate is ≤1.2× the current 3→4 rate, and adjacent keys differ by ≤10° of FOV.
6. Parallax is ≤.1 m, and zero in REDUCE, on coarse pointers, and on the beat.

### Motion choreographer: `choreography.js`

**Skills.**
- TS `motion.md` §1, §5–§7
- PS `game-development/create-game-vfx/SKILL.md`, "Specify": for each effect, define trigger, owner, duration, meaning and reduced-motion equivalent
- PS `references/realtime-architecture.md` §7: named channels, update order

**Brief.**
- **Logo.** It is a mounted glow sign. Retire float, separation and emphasis. The artwork stays pixel-faithful, rigid and evenly backlit.
- **The pulse is yours.** Apply it multiplicatively, after the environment update, within §5 limits.
- **Spill amounts.** Write `uSpill` (it tracks the door gap: 80% by .55, full by .80, × (1 − dawn)) and `uDawnSpill`, both as pure envelopes read from `RV_CONFIG`.

**Acceptance.**
1. The logo's triangles stay within ±4° of the source hue, the white letters stay neutral (|R−B| ≤6/255), and no vertex is displaced.
2. Beat amplitudes stay within §5. The beat is 0 from 3.70, when paused, and in REDUCE.
3. Frames .214 s apart differ by <3% in mean luma, in every chapter.
4. The wedge is visible from .38, and in the .6 still it reads as a triangle with its apex at the door (the Critic decides yes or no).
5. Reduced-motion stills at 0 and 1 show the final states. No new RAF, no per-frame allocation, and `dispose()` restores everything.

## 7. Critic's rubric

**Skills.**
- TS `critique.md` governs.
- PS `references/quality-and-qa.md` §1: the evidence matrix of the 11 moments at 1440×900, 768×1024 and 390×844, plus reverse and reduced runs.
- PS `codex/audit-reference-originality`, run against the Kage reference.

**Metrics.** Stills are downscaled ×4, and luma uses Rec.709 weights on sRGB values.
- redTint: hue 340–20°, S ≥.25, V ≥.06.
- accentCore: hue 345–15°, S ≥.45, V ≥.2.
- dark: luma <.06.
- bright: luma >.75; brightSD is the luma SD of those pixels.
- clip: any channel ≥250.

**Score.** The weights are TS's: design 40% (one dominant per frame, motivated light, accent proportion, material craft); usability 30% (orientation in 3 s, legible logo, notices, 140 and WAY OUT, reversibility, portrait, reduced motion); creativity 20% (the idea visible at .6, 1 and 4); content 10% (true detail, no slogans or inventions).

**Waived TS caps.** The canvas-only contract rules these out, so they do not apply: inspector FAIL, headline caps, the four-picture floor and the primary-button cap. The live thing is the visitor's scroll as the clock of the night, plus sound on M.

**Caps.**

| Condition | Cap |
|---|---|
| Any DOM overlay | overall ≤5 |
| Logo altered, moving, or occluded during 0–1 | overall ≤6 |
| Mirrored text, an eyebrow, a rule, or index numbering | overall ≤6.5 |
| Void ≥10% of the frame with SD <.03; redTint >45%; broken LOW fallback | design ≤6.5 |
| Flicker, strobe, or a per-beat change ≥10% | usability ≤5 |
| Shake, beat-synced camera, clipping, or ambient motion in reduced mode | usability ≤6 |
| Squeezed portrait | usability ≤7 |
| Competitor test fails, or the originality audit finds Kage-distinctive overlap | creativity ≤6 |
| Wedge does not read as the logo's ▲ | creativity ≤7 |

**Done** means:
- overall ≥7.5 on desktop and ≥7.0 on portrait, with no cap applied;
- every acceptance criterion passes;
- §8 is held and `npm test` is green;
- every evidence-matrix cell has been looked at.

## 8. Performance guardrails

**Method.** PS `game-development/optimize-threejs-games`, "Apply low-risk fixes first", and `quality-and-qa.md` §10.

**Baseline** `renderer.info.render.calls` at chapters 0–5, including the 16 post passes:
- high: 195 / 261 / 104 / 64 / 201 / 94
- LOW: 187 / 161 / 102 / 64 / 123 / 94

**Ceilings** (high / LOW):

| Measure | High | LOW |
|---|---|---|
| Draw calls, at any chapter | ≤240 | ≤140 |
| Triangles | ≤80k | ≤45k |
| Programs | ≤30 | ≤30 |
| New texture memory | ≤8 MB | ≤3 MB |

PS's mobile envelope of 50–90 scene draws is the direction for LOW. Instancing the 48 driver meshes, merging the tubes and cutting bloom pay for the reduction.

**Additions allowed:**
- 0 realtime lights;
- one shadowed directional (1024² on desktop, none on LOW);
- 0 render targets;
- 0 full-screen passes, with at least 8 passes removed on LOW through the bloom cut;
- no per-frame allocation;
- no fragment loop of more than 8 iterations;
- reflection capture ≤512 px, every 3 frames.

**LOW drops:** shadows, planar reflection (falling back to the analytic sky plus wedge), MSAA, bloom beyond 2 levels, drip rings, and fog beyond 2 layers. DPR stays capped at 1.2. LOW never loses the Spill, the sky or the sunrise.

## 9. Skill precedence

TS governs taste: the idea, palette proportion, motion budget, tells and critique. PS governs 3D craft and QA: geometry, materials, light roles, camera checks and performance method. The shared contract in WORKFLOW.md beats both.

| Conflict | Winner and why |
|---|---|
| PS ledger `copy` and eyebrows, semantic DOM story, hotspots with DOM proxies | **Contract:** canvas only, so no copy and no hotspots |
| PS/Kage finish (grain, vignette, slow bloom) vs TS ban | **TS:** they are tells, and Kage's signature is an originality risk |
| PS palette roles and per-chapter accent arc vs TS proportions | **TS** proportions; the PS arc becomes the chapter fields |
| PS motion tables (word reveals, foreground retirement, sway) vs TS budget | **TS** budget; the PS amplitude format is used for the ambient layer |
| PS Catmull–Rom plus `lookAt` vs our Hermite plus yaw/pitch | **Ours**, proven over 120k samples; PS endpoint, collision and portrait rules still apply |
| PS draw-call envelopes vs our measured baseline | **Measured ceilings gate**; PS sets the direction for LOW |
| PS weather (rain, storm, lightning) | **TS:** wet ground only; no meaningless loops and no strobe |
