# Camera direction: handoff

Owner: Camera director (`src/ravers/camera.js`). Readers: Choreography, Grade, Critic, Integration.
Supersedes the previous version of this file. ART-DIRECTION.md §4–§6 remain the brief.

## 1. Read this first

- **Tests.** `node tests/camera.test.cjs` checks the route against proxy geometry (CPU, real Three math). The camera block in `tests/ravers-source.test.cjs` repeats clearance, logo and sun checks against the real scene triangles. Run the suite against a review build: `python src/ravers/build.py preview-camera.html && RV_PAGE=dist/preview-camera.html npm test` (all five suites pass). A plain `npm test` still stops at the environment's `dist/index.html predates…` message until the integration owner rebuilds `index.html`.
- **Input.** The route is a pure function of `RIG.smooth` (0–5), the viewport aspect and the pointer. It reads no clock, no beat and no frame history, so scrolling is reversible and capture is deterministic.
- **Windows.** `RV.camera.windows` is in `RIG.smooth`, the value the choreographer keys to. `RV.camera.windowsRaw` gives the same windows in raw scroll progress (the capture moments). `RV.camera.raw(s)` converts a single value (§4).
- **Interpolation.** Shape-preserving Hermite and yaw/pitch, as ART-DIRECTION §9 requires. Knots are non-uniform: the six chapter keys plus sub-keys. Fritsch–Butland interior tangents and three-point shape-preserving end tangents mean no coordinate, angle or FOV overshoots its keys. Roll is always 0, because orientation is built from yaw and pitch with world up.
- **Renders.** SwiftShader software GL. They show composition and timing only, not frame rate. Exposure is whatever `grade.js` held at render time. The Colour & Post engineer was editing it in parallel, so judge framing, not brightness.

## 2. The route in one paragraph

From the road at eye height, the camera trucks onto the door axis before the leaves part. Through the Spill it only pushes and cranes, from 2.2 to 3.2 m, into the triptych at 1: logo, open door and red wedge on one vertical axis. It holds the logo whole to 1.25. It descends between the open leaves, crosses the door plane at 1.88 and settles into the centred one-point corridor at 2. It drifts left and low to a 3/4 of the left stack at 3, with the booth, lamp and 140 in the lower right. It turns left across the column row, so the doorway enters the left third at 3.62, and lands on the sunrise doorway at 4. It walks out through the middle of the doorway with its heading held, passes the leaves (z > −3) at 4.42, then turns left again while backing out across the apron. It ends on the bookend facade: same side as 0, lower and closer, logo in the upper third.

## 3. Ledger

Positions are metres. "Look" is the authored look point `t`, or yaw/pitch where a sub-key is authored by angle. Yaw is 0 down −z, and negative turns left (toward −x). Both turns run left, so yaw falls monotonically from 3 to 5 (−10° to −366°). "held" keeps the previous yaw: the 4→5 heading is held until past the leaves. Raw is the scroll position (rvTravel) at which `RIG.smooth` reaches the key. Each integer key is held over a raw range.

| smooth (raw) | key | desktop position | desktop look | fov | portrait position | portrait look | fov |
|---|---|---|---|---|---|---|---|
| 0 (0–.12) | entrance | 3, 2.2, 19.2 | t (0, 6.3, −7.16); yaw −6.5, pitch 8.8 | 35 | .6, 2.2, 19 | t (0, 2.6, −7.16); yaw −1.3, pitch .9 | 64 |
| .35 (.415) | spill | 0, 2.45, 18.4 | t (0, 6.05, −7.16); yaw 0, pitch 8.0 | 35 | 0, 2.35, 18.4 | t (0, 2.9, −7.16); yaw 0, pitch 1.2 | 63 |
| 1 (.86–1.12) | triptych | 0, 3.2, 16.5 | t (0, 5, −7.16); yaw 0, pitch 4.4 | 35 | 0, 3, 16.6 | t (0, 4.2, −7.16); yaw 0, pitch 2.9 | 59 |
| 1.2 (1.332) | leaves-open | 0, 3.1, 15.4 | t (0, 4.85, −7.16); yaw 0, pitch 4.4 | 36 | 0, 2.95, 15.6 | t (0, 4.1, −7.16); yaw 0, pitch 2.9 | 60 |
| 1.72 (1.602) | crossing | 0, 2.15, −.5 | t (0, 2.75, −40); yaw 0, pitch .9 | 44 | 0, 2.1, .4 | t (0, 3, −40); yaw 0, pitch 1.3 | 62 |
| 2 (1.86–2.12) | corridor | 0, 1.9, −12.5 | t (0, 3.3, −40); yaw 0, pitch 2.9 | 44 | 0, 1.9, −12 | t (0, 3.7, −40); yaw 0, pitch 3.7 | 62 |
| 2.62 (2.550) | approach | −.5, 1.8, −21 | t (−2.6, 3.3, −36); yaw −8.0, pitch 5.7 | 47 | −.4, 1.8, −20.8 | t (−2.2, 3.4, −36); yaw −6.8, pitch 6.0 | 64 |
| 3 (2.86–3.12) | stack | −.9, 1.7, −24.6 | t (−3, 3, −36); yaw −10.4, pitch 6.4 | 50 | −.5, 1.75, −23 | t (−1.5, 3.2, −36); yaw −4.4, pitch 6.3 | 68 |
| 3.25 (3.362) | turn-a | −1.5, 1.9, −25 | yaw −69, pitch −2 | 57 | −1.2, 1.9, −24.6 | yaw −70, pitch 2 | 68 |
| 3.45 (3.465) | turn-b | −2, 2.1, −25.5 | yaw −118.6, pitch −1 | 57 | −1.8, 2.1, −25.8 | yaw −125, pitch 3 | 68 |
| 3.62 (3.550) | turn | −2.4, 2.3, −25.6 | yaw −155, pitch 3 | 55 | −2.3, 2.3, −26.6 | yaw −165, pitch 4 | 68 |
| 4 (3.86–4.12) | sunrise | −4.3, 3, −23 | t (−1.15, 3.6, 5); yaw −186.4, pitch 1.2 | 60 | −3.2, 2.6, −27 | t (−.4, 4.2, 5); yaw −185, pitch 2.9 | 76 |
| 4.1 (4.265) | walk | −3.25, 2.72, −17 | held; pitch −2.5 | 58 | −2.4, 2.45, −20 | held; pitch 0 | 73 |
| 4.2 (4.332) | walk-out | −2.2, 2.45, −11.5 | held; pitch −2.5 | 55 | −1.7, 2.3, −13 | held; pitch 0 | 71 |
| 4.42 (4.450) | exit | −.4, 2.1, −2.6 | held; pitch −2.5 | 50 | −.3, 2.05, −2.6 | held; pitch 0 | 66 |
| 4.52 (4.500) | out | −.16, 2.07, 1.43 | yaw −204.1, pitch −2.5 | 50 | −.24, 2.03, 1.33 | yaw −204, pitch 0 | 65 |
| 4.66 (4.570) | turn-out | .72, 2.04, 6.85 | yaw −237.1, pitch −2.75 | 48 | 0, 2.01, 6.62 | yaw −240, pitch −1 | 64.5 |
| 4.8 (4.648) | turn-back | 1.78, 2, 11.95 | yaw −275.7, pitch −3 | 46 | .28, 1.98, 11.59 | yaw −282.1, pitch −2 | 64 |
| 4.92 (4.731) | facade | 2.44, 1.97, 15.89 | yaw −316.8, pitch 1 | 43 | .46, 1.96, 15.9 | yaw −327, pitch 0 | 64.5 |
| 4.984 (4.805) | settle | 2.59, 1.95, 17.67 | yaw −352, pitch 5.5 | 41 | .5, 1.95, 17.42 | yaw −357.5, pitch 3 | 64.5 |
| 5 (4.86–5) | bookend | 2.6, 1.95, 18 | t (0, 5.2, −7.16); yaw −365.9, pitch 7.3 | 40 | .5, 1.95, 17.5 | t (0, 3.5, −7.16); yaw −361.2, pitch 3.6 | 64 |

**Changes from the §4 starting ledger, and why.**
- **0.** Moved .7 m back and narrowed to fov 35. The logo is 36.7% of the width (32–40% even at 16:9), the sodium head sits on the left edge and the apron is in the lower band. The ledger frame gave a 32.5% logo.
- **1.** Pitched down from the ledger's 7° to 4.4°. The logo top sits at NDC .93, so the wedge gets the lower band: 4.3% of the frame against 1.2% in the ledger view, which showed only a sliver. The logo is 42.1% wide.
- **3.** The ledger booth frame cropped the booth and the 140. The camera is now pulled back to −24.6 and looks up 6.4°, with the stack left and the booth whole lower right.
- **4.** The ledger 4 had the sun half behind a leaf. The camera now stands 1.8 m left of the ledger (the sun is fully inside the opening, as `v40b` recommended) and 4 m nearer the door, with fov 60. The doorway fills 14.5%.
- **Portrait 4.** At z −27 with fov 76, so the doorway is ≤18% of the tall frame and the gold band runs up the lower half to it.
- **5.** Lower (1.95) and nearer than 0: 25.2 m from the logo plane against 26.4 m (27.0 against 28.1 m to the logo centre). The logo-to-canopy clearance therefore caps how close the bookend can come; see §7.

**Responsive.** Portrait weight is `w = clamp((1.15 − aspect)/.6, 0, 1)`: desktop frames at ≥1.15, portrait frames at ≤.55, blended between (a 768×1024 tablet is w .67). Desktop FOV is vertical, so wider screens see more to the sides (Hor+). The integer keys keep their raw hold ranges.

**Parallax.** At most .1 m (vector length), along the camera's horizontal right axis and vertically ×.55, then re-aimed at the authored point 20 m ahead. In portrait it is ×.35. `applyCamera` passes 0 under `REDUCE` and on `COARSE` pointers. The host already scales the pointer to ±.35, so a real desktop sees ≤.035 m.

## 4. `RV.camera` API and the windows the choreographer keys to

`RV.camera.sample(progress, aspect=16/9, pointerX=0, pointerY=0, out?)` returns `{position, target, direction, quaternion, fov, yaw, pitch, progress, portrait}`. `target` is 20 m along the view direction. Other members:
- `createSample()`
- `current` (the live sample)
- `keys` (the ledger above)
- `chapters` (the six integer records, also `CAM` / `RV_CONFIG.camera`)
- `windows`, `windowsRaw`
- `raw(s, edge)`
- `portraitWeight(aspect)`
- `parallax`

`applyCamera` is replaced by this sampler. `fitAspect` is a no-op, so there is no aspect dolly. The original `buildRig` still runs (layers, temporary camera), wrapped to fix `camera.up`.

| window | smooth | raw | meaning |
|---|---|---|---|
| `logo` | 0–1.25 | 0–1.362 | All four logo corners framed and clear of the canopy, on every aspect (16:9, 16:10, 1:1, 3:4, 9:16, 390×844) and pointer extreme. Previously 0–1; float/separation envelopes keyed to it stretch slightly. |
| `spill` | .35–1.2 | .415–1.332 | On the door axis (x 0, yaw 0): the camera only pushes and cranes. |
| `wedge` | .38–1.73 | .43–1.607 | The red wedge is on screen (>.5% of the frame) on every aspect. It stays in the lower half from .6 to 1.15. Its share of the frame at 1: desktop 4.3%, portrait 10.2%. |
| `triptych` | .8–1.25 | .648–1.362 | Full wedge, open door and whole logo on one vertical axis. |
| `logoDeparture` | 1.25–1.52 | 1.362–1.5 | The logo leaves through the top of frame. It is out of frame on every aspect by 1.52. |
| `crossing` | 1.78–1.92 | 1.636–1.731 | Between the open leaves (z −3.6 at 1.79) and through the door plane (z −7.75 at 1.876–1.89). |
| `entry` | 1.2–2 | 1.332–2.12 | Leaves fully open to the corridor. |
| `hall` | 2–2.62 | 1.86–2.55 | Corridor and approach. |
| `booth` | 2.62–3.1 | 2.55–3.265 | Low 3/4 on the left stack, booth, lamp and 140. |
| `turn` | 3–4 | 2.86–4.12 | The left turn across the column row. |
| `doorway` | 3.52–4.27 | 3.50–4.373 | The doorway is in frame (desktop). |
| `sunrise` | 3.62–4.27 | 3.55–4.373 | The sun is inside the doorway and in frame (desktop, 16:10 and 16:9). |
| `exit` | 4.26–4.42 | 4.367–4.45 | Out through the centre of the doorway (door plane at 4.288–4.302) and past the leaves, heading held. |
| `turnBack` | 4.42–5 | 4.45–5 | The left turn back to the facade while backing out. |
| `bookend` | 4.988–5 | 4.812–5 | The facade and the whole logo are framed again, every aspect. Desktop is whole from 4.974 (raw 4.79). |

**Timeline coincidences for the choreographer.**
- The Spill window equals `RV_CONFIG.doorOpen` [.35, 1.2], and the camera is static in yaw and x throughout it.
- The beat stops (3.40–3.70) while the camera is mid-turn. It faces the left wall at 3.25–3.45 and the doorway enters at 3.52.
- The road sodium switches off (4.33–4.50) while the camera is in the doorway and just outside, looking out at the road pole (in frame at 4.52).
- Red is gone (4.10) before the exit begins.

## 5. Clearance: method and results

- **Near plane.** For every sample, nothing may lie within the distance from the eye to the near-plane corners. For near .35, that distance is `.35·√(1 + tan²(fov/2)·(1 + aspect²))`, between .41 and .54 m along this route.
  - Proxy test (`camera.test.cjs`): +5 cm margin, against 70 padded boxes taken from environment-notes §5 (facade, jambs, canopy and stays, sign box, steps, poles, bollards, kerbs, estate, neighbours, hall walls, roof, columns, knee braces, trusses, trays, duct, stacks, booth, tube, shutter, mezzanine, stair, WAY OUT, plinths, cables) plus the floor plane. The door leaves are oriented boxes (leaf plus hardware, local z −.15…+.28) at `side·smoothstep(doorOpen)·1.45`, with the right leaf lagging .03.
  - Real test (`ravers-source.test.cjs`): +2 cm margin, against every triangle of the built scene. The door leaves, hardware, seam and under-door line are re-gathered from the real hinge transforms at each sample's progress, via `updateWorld`.
- **Sampling.** 10,001 samples (every .0005 of progress) × 6 aspects (16:9, 16:10, 1:1, 3:4, 9:16, 390×844) × pointer extremes. That is 300,030 samples on proxies (5 pointers) and 180,018 on real triangles (3 pointers).
- **Results.**
  - Every sample is clear.
  - Real geometry: the nearest surface is 1.70 m, the threshold step under the camera at the crossing (smooth 1.89). No sample has any triangle within 1.2 m of the eye.
  - Proxies: minimum 1.40 m, the plinth band at 3.
  - The leaves are only entered after they are fully open. The camera reaches z −3.6 at 1.79, after doorOpen ends at 1.20, and the exit stays within |x| ≤ 1.55 between z −8.6 and −3.5.
- **Sight lines.** These are rays against real triangles.
  - 3,096 logo-corner rays over 0–1.25 and the bookend window are unblocked.
  - At 70 sunrise samples the sun ray (real `uSun`, estate excluded) passes the doorway and both leaves unblocked.

## 6. Acceptance (ART-DIRECTION §6, Camera director)

| # | Criterion | Result | Values |
|---|---|---|---|
| 1 | 0–1.15: all logo corners framed and unoccluded, 4 aspects | **Pass** | 0–1.25 on 6 aspects × 3 pointers (proxies, and real triangles for the rays) |
| 1 | Logo width 32–40% at 0 | **Pass** | 36.7% (1440×900), 33.0% (16:9) |
| 1 | ≥42% at 1 | **Pass at 1440×900** | 42.1%; 37.8% at 16:9 (Hor+; see §7) |
| 1 | 30–40% at 5 | **Pass** | 33.4% / 30.1%; logo bottom at NDC +.55, so the logo is in the upper third |
| 1 | Portrait logo ≥65% of the width | **Pass** | 67.5% at 0, 81.3% at 1, 70.5% at 5 |
| 1 | Portrait sky ≤15% at 0 and ≤18% at 1 | **Pass** | 13.3% / 12.5% (proxy rays) |
| 2 | Roll 0 | **Pass** | Camera x-axis y-component <1e-9 everywhere |
| 2 | Pitch within ±20° | **Pass** | −3.0° to +8.9° (the crane allowance is not needed) |
| 3 | No frame >45% one featureless surface (check 3.55–3.9) | **Pass in the check window; see §7 for 3.2–3.45** | 3.55–4.10, all aspects: worst 41.4% (inner facade at 4.09, 16:9). Whole route: 55% left wall at 3.35 |
| 3 | At 4 the doorway fills 8–18% with the sun inside it | **Pass** | 16:9 13.0, 16:10 14.5, 1:1 17.6, 3:4 15.2, 9:16 14.8, 390×844 17.7%; sun inside the opening and in frame on all 6 |
| 4 | Near-plane clearance, 10,001 samples × 4 aspects, including the exit through the leaves | **Pass** | §5: 6 aspects; real-triangle minimum 1.70 m |
| 5 | Peak yaw rate ≤1.2× the current 3→4 rate | **Pass (per scroll and in time)** | Per raw scroll: 508 vs 448°/chapter at 16:10 (1.13×), 574 vs 507 at 390×844 (1.13×). Steady scrolls of .25–1 chapter/s through rvTravel and damping 6.2: 429 vs 388°/s (1.11×). Per `RIG.smooth` it is 1.39× (see §7) |
| 5 | Adjacent keys ≤10° FOV | **Pass** | Largest step 8° (desktop 1.2→1.72; portrait 3.62→4) |
| 6 | Parallax ≤.1 m, zero in REDUCE, on coarse pointers, and never on the beat | **Pass** | Max .100 m (clamped vector); `applyCamera` gives exactly the no-pointer pose under REDUCE and COARSE; camera.js reads no clock or beat (asserted on its source) |
| — | Brief: entrance about fov 40, doors and logo on one axis | **Pass** | fov 35; logo and door centres within .03 NDC of the same vertical |
| — | Spill: push and crane only, logo whole, wedge in the lower half | **Pass** | x = 0 and yaw = 0 over .35–1.2; wedge centroid below centre and >2% of the frame over .6–1.15 on 5 aspects |
| — | Triptych at 1 on one axis | **Pass** | Logo centre, door centre and wedge apex within .03 NDC (desktop and portrait) |
| — | 2: centred one-point corridor | **Pass** | x 0, look x 0 (both sets) |
| — | 3: low 3/4 of the stack, not down at the desk | **Pass** | Eye 1.7 m, pitch +6.4°; stack centre left of centre; all 8 booth corners in frame, centroid lower right (desktop, 16:9, portrait) |
| — | 3→4 turns left across the column row, no blank-wall frames | **Partly** | Yaw falls monotonically from −10° to −186°, crossing −90° (the column row) at 3.33. The doorway is in frame from 3.52. The left wall fills 49–55% at 3.25–3.40 (§7) |
| — | 4→5: exit |x| < 3.5, left turn only after z > −3, bookend | **Pass** | Exit |x| ≤1.55; the turn starts at 4.42 with z −2.58 on every aspect; the bookend is the same side (x +2.6 / +.5), lower (1.95 vs 2.2) and closer (25.2 vs 26.4 m from the logo plane) |

## 7. Known limits

1. **Wide desktop viewports.** Desktop FOV is vertical (Hor+). At 16:9 the logo is 37.8% at 1, under the 42% target, and 33.0% / 30.1% at 0 and 5. Typical browser viewports, 1.8–2.0, sit lower still. Holding 42% at 16:9 would cut the wedge band to about 7% of the frame height.
2. **The wedge is a flat fan at 1 on desktop.** It holds 4.3% of the frame. The logo ≥42% target fixes the frame height at the facade (about 15 m), which leaves the wedge a band of about 17% of the frame height under the threshold. At eye height 3.2 m (the bible caps progress-1 at 3–3.4 m), any 14 m ground triangle reads foreshortened. Portrait and tablet show it far larger (10%; the tablet still reads as a fan/▲). Whether the .6 still "reads as a triangle" is the Critic's call. The apex area is partly behind the threshold steps.
3. **Mid-turn wall (3.25–3.45, raw 3.36–3.47).** A left turn in this hall must face the left wall. By proxy the wall fills 49–55% (real-geometry estimate 52%), with three columns, the duct and the floor in frame.
   - **In the video.** At 4 s per chapter, frames 142–148 (about .6 s) are near-black: no pixel is above .15 luma, and the column row reads only as darker verticals.
   - **Tried.** A wider and lower framing, a 2° downward tilt (already used to bring floor into frame), and pivoting the turn from behind the decks, so the booth and stack would sit in the wall-facing frames. None of them lights the frame, because nothing on the left of the hall is lit before dawn starts at 3.55.
   - **Check window.** The criterion's own window (3.55–3.9) passes at 41% or less.
   - **Real fix, for Environment.** A faint motivated source on the left bays during 3.2–3.5: back-wash spill reaching the rear left columns, or the roof sheets starting to pale at about 3.3. That would let the column row read in silhouette as the turn crosses it.
4. **Empty quadrant during the turn-back (4.55–4.9, raw 4.53–4.70).** Facing +x from the apron there is nothing beyond the right neighbour shed and the estate edge at x 46. Real-geometry rays give 32–46% sky and 41–47% wet apron and road in those frames. It passes in about .17 of a chapter's scroll. Mitigations: a 2.5–3° tilt down to the wet apron and an even yaw rate. Real fix, for Environment: mass on the +x side of the yard, such as a compound wall or shed at x 20–40, z −6…+20.
5. **Yaw rate per `RIG.smooth` and under flicks.** The criterion is met per unit of scroll and in time at steady scroll speeds.
   - The 3→4 turn must reach the 3.62 composition, the doorway entering the left third (yaw −155; the AD ledger implied −160). So it is front-loaded in smooth progress: per `RIG.smooth` it peaks at 308°/chapter, against 221 for the old route (1.39×).
   - A one-chapter flick (the target jumps and only damping moves the camera) peaks at 1,584°/s, against 862 (1.84×).
   - The exit turn is laid out evenly in scroll, so per `RIG.smooth` it is steep near s = 5 (937°/chapter at 16:10, where rvTravel holds `RIG.smooth` almost still). Because of that it is gentle in time: 722°/s on a flick.
6. **Speed spikes.** The exit walk peaks at 86 m per chapter of scroll on desktop and 110 in portrait. The crossing (1→2) peaks at 81–84. The old route peaked at 58. Portrait is fastest because its sunrise frame stands 4 m further back. The sub-keys at 4.1 and 4.2 already flatten the walk (from 125/144).
7. **4.52 is outside, not at the threshold.** To keep the exit yaw rate within 1.2×, the left turn starts at 4.42 (z −2.6). At 4.52 the camera is 9 m past the door plane, turned 18° left. It still shows the road, compound wall, sheds and the road sodium switching off.
8. **Canopy stays.** The two thin stays (x ±4.3) cross the face of the sign from below at every low viewpoint (the dark strokes through the R and the N). The corners and edge centres are clear; this is Environment's geometry.
9. **Bookend clearance.** "Lower and closer" than 0 is bounded by the canopy rule (camera y ≥ 10.66 − .354·d). At y 1.95 the bookend can come no nearer than about 24.6 m from the logo plane. It stands at 25.2 m, 6 cm of ray clearance above the canopy edge.
10. **Verification scope.** All of the above is CPU geometry and SwiftShader renders. It says nothing about GPU frame time; the camera itself does a dozen scalar Hermite evaluations and one look matrix per frame, with no allocation. It does not cover text legibility under the final grade, or behaviour on real touch devices.

## 8. For other roles

- **Choreography.** Key the logo envelopes to `windows.logo` (now 0–1.25) and the wedge to `windows.wedge` / `triptych`. The beat stop (3.40–3.70) lands mid-turn. Nothing on the camera reads the beat.
- **Grade.** At 4 the frame is 83% dark (mean luma .089) around a 14.5% doorway. At 4.52 the frame is the bright estate (mean luma .53). In the 4.55–4.9 turn-back sky is 32–46% of the frame. Figures are from `review/camera/`, built with `grade.js` as it stood at render time.
- **Environment.** See §7, items 3, 4 and 8.
- **Critic.** Stills are in `review/camera/` (1440×900 and `-portrait` 390×844) and `review/camera-tablet/` (768×1024). Motion is in `review/camera-video/ravers-960x540.mp4` and `frames/`, a 20 s run at 12 fps. In it:
  - frames 0–84: entrance, Spill and triptych; the logo leaves the top at about 84
  - 90: the crossing
  - 96–132: corridor, approach and stack
  - 136–149: the left turn (142–148 are the dark left-wall frames)
  - 151–172: the doorway entering and the sunrise
  - 172–182: the walk-out and the door plane, with the sun between the leaves at 178
  - 184–205: the turn-back (the empty quadrant at about 190–195)
  - 205–239: the bookend.
